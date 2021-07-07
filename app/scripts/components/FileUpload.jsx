import React, {Component} from 'react';
import {request} from '~/services/SuperAgent';
import SparkMD5 from 'spark-md5';

const blobSlice = File.prototype.slice || File.prototype.mozSlice || File.prototype.webkitSlice;
const storage = window.localStorage;

export default class FileUpload extends Component {

  constructor(props) {
    super(props);
    this.chunkSize = 1024 * 1024 * 2;

    this.state = {
      progress: 0,
      errorMessage: '',
      successed: false
    }
  }

  handleChange(event) {
    if (event.target.files || event.target.files[0]) {
      this.setState({
        progress: 0,
        errorMessage: '',
        successed: false
      });

      const file = event.target.files[0];

      this.chunkAndMd5(file)
        .then(({md5, fileChunks}) => {
          console.log("md5", md5);
          console.log("fileChunks", fileChunks);
          this.uploadFiles(file, md5, fileChunks);
        })
        .catch((error) => {
          this.setState({
            errorMessage: `文件上传失败: ${error}`
          });
        });
    }
  }


  chunkAndMd5(file) {
    const chunkSize = this.chunkSize;
    const chunks = Math.ceil(file.size / chunkSize);
    const spark = new SparkMD5.ArrayBuffer();
    const fileReader = new FileReader();
    const fileChunks = []; // 存放文件片段，记录每段的开始和结束位置
    let currentChunk = 0;

    return new Promise((resolved, rejected) => {
      const loadNext = () => {
        const start = currentChunk * chunkSize;
        const end = ((start + chunkSize) >= file.size) ? file.size : start + chunkSize;
        fileChunks.push({
          start,
          end
        });
        fileReader.readAsArrayBuffer(file.slice(start, end));
      };

      fileReader.onload = function(e) {
        spark.append(e.target.result);
        currentChunk += 1;

        if (currentChunk < chunks) {
          loadNext();
        } else {
          const md5 = spark.end();
          resolved({
            md5,
            fileChunks,
            chunks
          });
        }
      };

      fileReader.onerror = function() {
        rejected('readAsArrayBuffer Error');
      };

      loadNext();
    });
  }


  uploadFiles (file, md5, fileChunks) {
    // storageChunks 中存的是已经上传的文件片段的索引
    const storageChunks = JSON.parse(storage.getItem(md5)) || [];

    // 如果所有的文件片段都已经上传，即 storageChunks.length === fileChunks.length，则直接发送合并所有文件片段的请求
    if (Array.from(new window.Set(storageChunks)).length === fileChunks.length) {
      this.setState({
        progress: 100,
        uploading: false,
        pushing: true
      });
      this.makefile(md5, fileChunks.length, file.name);
      return;
    }

    const uploadQueue = [];
    const progressTotal = [];

    fileChunks
      // 过滤掉已经上传过的文件片段
      .map((chunk, index) => {
        // 判断当前文件片段是否已经上传过
        const isExist = storageChunks.includes(index);

        // 已经上传过的片段的进度等于片段的长度
        progressTotal[index] = isExist ? this.chunkSize : 0;

        // 已经上传过的片段 chunk 标为 undefined
        return isExist ? null : chunk;
      })

      // 遍历剩下的文件片段并开始上传
      .forEach((chunk, index) => {
        // 如果片段 chunk 为 undefined，则跳过
        if (chunk) {
          // 使用 file.slice 获取当前 chunk 的 blob 数据
          const fileChunk = file.slice(chunk.start, chunk.end);
          const chunkPromise = this.uploadFile(fileChunk, md5, index, (p) => {
            progressTotal[index] = p.loaded;

            // 通过 reduce 函数将每个 chunk 的进度相加，得出总的上传进度
            const loadedTotal = progressTotal.reduce((a, b) => {
              return a + b;
            }, 0);

            this.setState({
              progress: parseInt((loadedTotal / file.size) * 100, 10)
            });
          });

          uploadQueue.push(chunkPromise);

          chunkPromise.then(() => {
            storageChunks.push(index);
            storage.setItem(md5, JSON.stringify(storageChunks));
          });
        }
      });

    // 当所有的文件片段上传完成后，发送合并所有文件片段的请求
    Promise.all(uploadQueue).then(() => {
      this.setState({
        progress: 100
      });
      console.log("file", file);
      this.makefile(md5, fileChunks.length, file.name);
    });
  }

  uploadFile (fileChunk, md5, index, progress) {
    const formData = new FormData();
    formData.append('file', fileChunk);

    return new Promise((resolved, rejected) => {
      const uploadProgress = (event: any) => {
        if (event.lengthComputable) {
          if (progress) {
            progress({
              loaded: event.loaded,
              total: event.total,
              index
            });
          }
        }
      };

      const uploadComplete = (event: any) => {
        resolved(event.target.responseText);
      };

      const uploadFailed = (event: any) => {
        rejected('文件上传失败', event);
      };

      const uploadCanceled = (event: any) => {
        rejected('文件上传被中止', event);
      };

      // new 一个 XMLHttpRequest 用于上传文件，XMLHttpRequest 通过监听 progress 事件，可以获取文件上传进度
      const xhr = new XMLHttpRequest();
      xhr.upload.addEventListener('progress', uploadProgress, false);
      xhr.addEventListener('load', uploadComplete, false);
      xhr.addEventListener('error', uploadFailed, false);
      xhr.addEventListener('abort', uploadCanceled, false);

    	xhr.open('PUT', `http://localhost:8007/api/upload/${md5}/${index}`);
    	xhr.send(formData);
    });
  }

  makefile(md5, chunkTotal, filename) {
    fetch(`http://localhost:8007/api/makefile/${md5}/${chunkTotal}?filename=${filename}`, {
      method: 'POST',
      mode: 'cors'
    }).then((response) => {
      if(response.status == 200){
        this.setState({
          successed: true
        });
      }
    })
  }

  render() {
    const {progress, errorMessage, successed} = this.state;

    return(
      <div className="welcome">
        <input type="file" name="file" onChange={this.handleChange.bind(this)} />
        <div style={{margin: '10px 0'}}>
          <div className="loading-bar">
            <div className="bar" style={{width: `${progress}%`}}></div>
          </div>
        </div>
        {errorMessage && <div style={{color: 'red', fontSize: '14px'}}>{errorMessage}</div>}
        {successed && <div style={{color: 'green', fontSize: '14px'}}>文件上传成功！</div>}
      </div>
    )
  }
}
