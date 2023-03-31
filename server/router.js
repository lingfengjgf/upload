const express = require("express");
const cors = require("cors");
const multiparty = require('multiparty');
const path = require("path");
const fse = require("fs-extra");

const router = express.Router();

const UPLOAD_DIR = path.resolve(__dirname, "./", "target"); // 大文件存储目录

// 挂载
router.use(cors({
  origin:['*'],
  methods:['GET','POST']
}))

router.get('/test', (req, res) => {
  res.send({code:"000",msg:'请求成功'});
})

router.post('/handshake', (req, res) => {
  console.log(req.body);
  res.send({code:"000",msg:'请求成功'});
})

router.post('/upload', (req, res) => {
  const form = new multiparty.Form();
  form.parse(req, async (err, fields, files) => {
    if(err){
      console.log(err);
      return ;
    }
    // console.log("fields:",fields)
    // console.log("files:",files)
    const [chunk] = files.file; // 切片文件
    const [currentChunk] = fields.currentChunk; // 切片下标
    const [hash] = fields.md5; // 切片MD5
    const [filename] = fields.pt_md5; // 整个文件的MD5
    const chunkDir = path.resolve(UPLOAD_DIR, filename);

    // 切片目录不存在，创建切片目录
    if(!fse.existsSync(chunkDir)){
      await fse.mkdirs(chunkDir);
    }

    await fse.move(chunk.path, `${chunkDir}/${hash}-${currentChunk}`);
    res.send({code:"000",msg:'上传成功',data:{currentChunk}});
  });
  
})

router.post('/merge', async (req, res) => {
  const hash = req.body.hash;
  const name = req.body.name;
  const size = req.body.size;
  // 切片路径
  const chunkDir = path.resolve(UPLOAD_DIR, hash);
  // 生成的文件名
  const fileName = path.resolve(UPLOAD_DIR, name);
  const chunkPaths = await fse.readdir(chunkDir);

  // 根据切片下标进行排序,否则直接读取目录的获得的顺序可能会错乱
  chunkPaths.sort((a, b) => a.split("-")[1] - b.split("-")[1]);
  await Promise.all(chunkPaths.map((chunk, index) => pipeStream(path.resolve(chunkDir, chunk), fse.createWriteStream(fileName, {
    start:index * size,
    end:(index + 1) * size
  }))));
  setTimeout(() => {
    fse.rmdirSync(chunkDir); // 合并后删除保存切片的目录
  },300)
  res.send({code:"000",msg:'合并成功'});
})

const pipeStream = (path, WriteStream) => {
  new Promise((resolve, reject) => {
    const readStream = fse.createReadStream(path);
    readStream.on('end', () => {
      fse.unlinkSync(path);
      resolve();
    })
    readStream.pipe(WriteStream);
  })
}

module.exports = router;