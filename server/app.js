const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const router = require("./router");

// 创建服务器
const app = express();

// 定义端口
const port = '3000';

app.get('/',(req,res)=>{
  res.send("Hello Word!");
})

// 配置中间件
app.use(express.urlencoded({extended:false}));

app.use(cors());

app.use(bodyParser.urlencoded({ extended: false }))
app.use(bodyParser.json())

// 挂载路由
app.use("/api",router)

// 监听端口
app.listen(port, ()=>{
  console.log("服务器已启动...")
})