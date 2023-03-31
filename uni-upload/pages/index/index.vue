<template>
	<view class="content">
		<image class="logo" src="/static/logo.png"></image>
		<view class="text-area">
			<button @click="chooseVideo">{{title}}</button>
		</view>
		<button @click="mergeClick">合并</button>
	</view>
</template>

<script>
	import { handshake, callUpload, merge } from "@/service/index.js";
	import UploadVideo from "@/common/js/upload.js";
	export default {
		data() {
			return {
				title: '上传',
				hash:'',
			}
		},
		onLoad() {

		},
		methods: {
			chooseVideo(){
				// let res = {
				// 	byteLength:3312515,
				// 	filePath:'12312312'
				// }

				uni.chooseVideo({
					success: (res) => {
						console.log("chooseVideo:",res);
						let data = {
							byteLength:res.size,
							filePath:res.tempFilePath
						}
						this.upload(data);
					},
					fail: (err) => {
						console.log("chooseVideo fail:",err);
					}
				})
				
				// let params={test:'11111'}
				// handshake(params).then(data=>{
				// 	console.log("handshake data:",data);
				// }).catch(err=>{
				// 	console.log("handshake err:",err);
				// })
			},
			async upload(data){
				const uploadFile = new UploadVideo(data);
				let shakeInfo = uploadFile.getShakeInfo();
				console.log("shakeInfo:",shakeInfo);
				this.hash = shakeInfo.md5;
				const handshakeRes = await handshake(shakeInfo);
				if(handshakeRes.code != '000'){
					uploadFile.currentChunk--;
					return;
				}
				const fs = uni.getFileSystemManager();
				let temp;
				while (uploadFile.currentChunk < uploadFile.chunksLen){
					try{
						const {tempPath,formData} = await uploadFile.getUploadChunk();
						temp = tempPath;
						console.log("getUploadChunk tempPath:",tempPath);
						console.log("getUploadChunk formData:",formData);
						const uploadData = await callUpload(tempPath, formData);
						// 删除临时文件
						fs.unlinkSync(tempPath);
						uploadFile.currentChunk++;
						console.log("uploadData:",uploadData);
					}catch(e){
						//TODO handle the exception
						console.log("getUploadChunk err:",e);
						fs.access({
						  path: temp,
						  success() {
							// 文件存在
							fs.unlinkSync(temp);
						  },
						  fail(res) {
							// 文件不存在或其他错误
							console.log("文件不存在:",res)
						  }
						})
					}					
				}
				
			},
			async mergeClick(){
				try{
					const data = await merge({hash:this.hash, name:'weixin_video.mp4', size:2097152});
					console.log("mergeClick data:",data);
				}catch(e){
					console.log("mergeClick err:",e);
				}
				
				
			}
		}
	}
</script>

<style>
	.content {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
	}

	.logo {
		height: 200rpx;
		width: 200rpx;
		margin-top: 200rpx;
		margin-left: auto;
		margin-right: auto;
		margin-bottom: 50rpx;
	}

	.text-area {
		display: flex;
		justify-content: center;
	}

	.title {
		font-size: 36rpx;
		color: #8f8f94;
	}
</style>
