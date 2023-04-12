import SparkMD5 from "spark-md5";

export default class UploadVideo {
	constructor(options){
		this.options = options;
		this.options.type = 'video/mp4';
		this.options.size = 2097152;
		this.options.fileName = 'weixin_video.mp4';
	}
	getShakeInfo() {
		this.chunksLen = Math.ceil(this.options.byteLength / this.options.size);
		this.currentChunk = 0;
		this.file_md5 = this.getMD5(this.options.filePath);
		let formData = {...this.options};
		formData.chunksLen = this.chunksLen;
		formData.md5 = this.file_md5;
		return formData;
	}
	getMD5(data){
		if(data){
			let chunk = new SparkMD5();
			chunk.appendBinary(data);
			return chunk.end();
		}
	}
	getUploadChunk(){
		return new Promise((resolve, reject) => {
			let size = this.options.size;
			let byteLength = this.options.byteLength;
			let start = this.currentChunk * size;
			let length = start + size > byteLength ? byteLength - start : size;
			const fs = uni.getFileSystemManager();
			let readFileData;
			try{
				readFileData = fs.readFileSync(this.options.filePath, 'binary', start, length);
			}catch(e){
				console.log('readFileSync err:',e);
			}
			// console.log('readFileData:',readFileData);

			const md5 = this.getMD5(readFileData);
			// 创建临时文件
			const tempPath = `${wx.env.USER_DATA_PATH}/up_temp/${md5}.temp`;
			// 创建目录
			try{
				fs.accessSync(`${wx.env.USER_DATA_PATH}/up_temp`);
			}catch(e){
				console.log("accessSync err:",e);
				fs.mkdirSync(`${wx.env.USER_DATA_PATH}/up_temp`, false);
			}
			// 写入文件系统
			try{
				fs.writeFileSync(tempPath, readFileData, 'binary');
				const formData = {
					currentChunk : this.currentChunk+1,
					file_md5 : this.file_md5,
					md5
				}
				resolve({tempPath,formData});
			}catch(e){
				console.log('writeFileSync err:',e);
				reject(e);
			}
			
		})
	}
}
