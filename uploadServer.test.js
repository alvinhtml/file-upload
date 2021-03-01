const Koa = require('koa');
const Router = require('koa-router');
const koaBody = require('koa-body');
const fs = require('fs');
const cors = require('koa2-cors');
const path = require('path');
const app = new Koa();


app.use(koaBody({
  multipart: true
}));

app.use(cors({
  // 设置允许来自指定域名请求
  origin: function(ctx) {
    return ctx.header.origin;
  }
}));

// 上传文件
const uploadFile = ctx => {
  // 获取上传文件
  const file = ctx.request.files.file;
  // console.log("file:", file);

  // 读取文件流
  const fileReader = fs.createReadStream(file.path);
  // console.log("fileReader", fileReader);

  // 设置文件保存目录
  const filePath = path.join(__dirname, `/static/uploads/${ctx.params.md5}`);

  // 组装文件绝对路径
  const fileResource = filePath + `/part-${ctx.params.index}`;

  // console.log("filePath", filePath);
  console.log("fileResource", fileResource);

  if (!fs.existsSync(filePath)) {
    fs.mkdirSync(filePath);
    const writeStream = fs.createWriteStream(fileResource);
    try {
      fileReader.pipe(writeStream);
      ctx.status = 201
      ctx.body = {url: fileResource};
    } catch (err) {
      ctx.throw(500, err);
    }
  } else {
    const writeStream = fs.createWriteStream(fileResource);
    try {
      fileReader.pipe(writeStream);
      ctx.status = 201
      ctx.body = {url: fileResource};
    } catch (err) {
      ctx.throw(500, err);
    }
  }
}

// 上传完成后合并文件
const makefile = async ctx => {
  const makefilePromise = () => {
    // 在 koa2 中处理异步任务，必须使用 await 等待异步任务处理完成
    return new Promise((resolved, rejected) => {
      const total = parseInt(ctx.params.total, 10);
      const filePath = path.join(__dirname, `/static/uploads/${ctx.params.md5}`);
      const fileResource = filePath + '.tar';
      const writeStream = fs.createWriteStream(fileResource);
      const chunks = Array.from(new Array(total), (v, i) => i);

      const writeCurrentStream = function() {

        const currentChunkIndex = chunks.shift();

        if (currentChunkIndex !== undefined) {
          const currentfile = `${filePath}/part-${currentChunkIndex}`;
          console.log("Read by Path:", currentfile);

          // 读取当前文件片段，并写入到 writeStream
          const readStream = fs.createReadStream(currentfile);
          readStream.pipe(writeStream, {
            end: false
          });

          // 当一个文件片段写入完成后，继续递归下一个文件片段
          readStream.on("end", function() {
              console.log(currentfile + ' appended');
              writeCurrentStream();
          });

          readStream.on('error', function(error) {
            console.error(error);
            writeStream.close();
          });
        } else {
          // 如果 currentChunkIndex 为 undefined， 说明文件已全部写入，这个时候需要关闭 writeStream，并 resolved Promise
          writeStream.end('end');
          resolved('ok!');
        }
      }

      writeCurrentStream();
    });
  }

  await makefilePromise();

  ctx.body = {
    successful: 'ok!'
  };
}

const testCors = ctx => {
  ctx.body = {
    successful: 'ok!'
  }
}

const uploadRouter = new Router();

uploadRouter.get('/api/cors', testCors);
uploadRouter.put('/api/upload/:md5/:index', uploadFile);
uploadRouter.post('/api/makefile/:md5/:total', makefile);

app.use(uploadRouter.routes());

app.listen(8007);
