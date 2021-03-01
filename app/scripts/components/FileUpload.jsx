import React, {Component} from 'react';
import {request} from '~/services/SuperAgent';
import SparkMD5 from 'spark-md5';

const blobSlice = File.prototype.slice || File.prototype.mozSlice || File.prototype.webkitSlice;

export default class FileUpload extends Component {

  constructor(props) {
    super(props);
    this.chunkSize = 1024 * 1024 * 20;

    this.state = {
      progress: 0
    }
  }

  componentDidMount() {
    fetch('http://localhost:8007/api/cors', {
      method: 'GET',
      mode: 'cors'
    })
    .then(response => response.json())
    .then(data => {
      console.log("data", data);
    })



  }

  handleChange(event) {
    if (!event.target.files || !event.target.files[0]) {
      console.log("请先上传文件！");
      return false;
    }

    this.setState({
      progress: 0
    })

    const file = event.target.files[0];

    this.chunkAndMd5(file)
      .then(({md5, fileChunks}) => {
        console.log("md5 fileChunks", md5, fileChunks);

        this.uploadFiles(file, md5, fileChunks);
      })
      .catch((error) => {
        console.log("error", error);
      })

  }

  chunkAndMd5(file) {
    const chunkSize = this.chunkSize;
    const chunks = Math.ceil(file.size / chunkSize);
    const spark = new SparkMD5.ArrayBuffer();
    const fileReader = new FileReader();
    const fileChunks = [];
    let currentChunk = 0;

    return new Promise((resolved, rejected) => {
      fileReader.onload = function (e) {
          spark.append(e.target.result);
          currentChunk++;

          if (currentChunk < chunks) {
              loadNext();
          } else {
            const md5 = spark.end();
              console.log('finished loading');
              console.info('computed hash', md5);
              console.log(chunks);

              resolved({
                md5,
                fileChunks,
                chunks
              })
          }
      };

      fileReader.onerror = function () {
          rejected('readAsArrayBuffer Error');
      };

      const loadNext = () => {
          var start = currentChunk * chunkSize,
              end = ((start + chunkSize) >= file.size) ? file.size : start + chunkSize;
          fileChunks.push({
            start,
            end
          });
          fileReader.readAsArrayBuffer(blobSlice.call(file, start, end));
      }

      loadNext();
    });
  }


  uploadFiles (file, md5, fileChunks) {
    const storage = window.localStorage;

    // storageChunks 中存的是已经上传的文件片段的索引
    const storageChunks = JSON.parse(storage.getItem(md5)) || [];

    // 如果所有的文件片段都已经上传，即 storageChunks.length === fileChunks.length，则直接发送合并所有文件片段的请求
    //
    console.log("storageChunks", storageChunks);
    console.log("Array.from(new Set(storageChunks)).length", Array.from(new Set(storageChunks)).length, fileChunks.length);
    if (Array.from(new Set(storageChunks)).length === fileChunks.length) {
      console.log("秒传！");
      this.setState({
        progress: 100
      })
      this.makefile(md5, fileChunks.length);
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
        console.log("progressTotal", progressTotal);

        // 已经上传过的片段 chunk 标为 undefined
        return isExist ? undefined : chunk;
      })

      // 遍历剩下的文件片段并开始上传
      .forEach((chunk, index) => {
        console.log("chunk", chunk);
        if (chunk) {
          const fileChunk = blobSlice.call(file, chunk.start, chunk.end);
          const chunkPromise = this.uploadFile(fileChunk, md5, index, ({loaded, total, index}) => {
            console.log("loaded", index, loaded, total);
            progressTotal[index] = loaded;
            console.log("progressTotal", progressTotal);
            const loadedTotal = progressTotal.reduce((a, b) => {
              return a + b;
            }, 0);
            this.setState({
              progress: parseInt(loadedTotal / file.size * 100, 10)
            })
          });

          uploadQueue.push(chunkPromise);

          chunkPromise.then(() => {
            storageChunks.push(index);
            storage.setItem(md5, JSON.stringify(storageChunks));
          })
        }
      });

    // 当所有的文件片段上传完成后，发送合并所有文件片段的请求
    Promise.all(uploadQueue).then(results => {
      console.log("results", results);
      this.makefile(md5, fileChunks.length);
    })
  }

  uploadFile (fileChunk, md5, index, progress) {
    const formData = new FormData();
    formData.append('file', fileChunk);

    return new Promise((resolved, rejected) => {
    	const uploadProgress = (event) => {
    		if (event.lengthComputable) {
    			if (progress) {
            console.log("progress", event.loaded, event.total);
    				progress({
    					loaded: event.loaded,
    					total: event.total,
              index
    				})
    			}
    		}
    	}

    	const uploadComplete = (event) => {
    		resolved(JSON.parse(event.target.responseText));
    	}

    	const uploadFailed = (event) => {

    	}

    	const uploadCanceled = (event) => {

    	}

    	let xhr = new XMLHttpRequest()
    	xhr.upload.addEventListener("progress", uploadProgress, false)
    	xhr.addEventListener("load", uploadComplete, false)
    	xhr.addEventListener("error", uploadFailed, false)
    	xhr.addEventListener("abort", uploadCanceled, false)

    	xhr.open("PUT", `http://localhost:8007/api/upload/${md5}/${index}`)
    	xhr.send(formData)

    });

  }

  makefile(md5, chunkTotal) {
    fetch(`http://localhost:8007/api/makefile/${md5}/${chunkTotal}`, {
      method: 'POST',
      mode: 'cors'
    })
  }

  render() {
    const {progress} = this.state;

    return(
      <h1 className="welcome">
        <input type="file" name="file" onChange={this.handleChange.bind(this)} />
        <div>
          <div className="loading-bar">
            <div className="bar" style={{width: `${progress}%`}}></div>
          </div>
        </div>
      </h1>
    )
  }
}
