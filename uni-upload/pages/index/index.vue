<template>
	<view class="content">
		<image class="logo" src="/static/logo.png"></image>
		<view class="">
			<button @click="test">测试</button>
		</view>
		<view class="text-area">
			<button @click="chooseVideo">{{title}}</button>
		</view>
		<button @click="mergeClick">合并</button>
	</view>
</template>

<script>
	import { handshake, callUpload, merge, test } from "@/service/index.js";
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
			test(){
				test().then(data=>{
					console.log('test data:',data);
				}).catch(err=>{
					console.log('test err:',err);
				})
			},
			chooseVideo(){
				// let res = {
				// 	byteLength:3312515,
				// 	filePath:'12312312'
				// }

				uni.chooseMedia({
					count:1,
					mediaType:['video'],
					success: (res) => {
						let file = res.tempFiles[0];
						let data = {
							byteLength:file.size,
							filePath:file.tempFilePath
						}
						this.upload(data);
					},
					fail: (err) => {
						console.log("chooseVideo fail:",err);
					}
				})
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
				let temp,form,stop=false;
				while (uploadFile.currentChunk < uploadFile.chunksLen && !stop){
					try{
						if(!form){
							const {tempPath,formData} = await uploadFile.getUploadChunk();
							// return 
							temp = tempPath;							
							form = formData;							
						}
						const uploadData = await callUpload(temp, form);
						// 删除临时文件
						fs.unlinkSync(temp);
						uploadFile.currentChunk++;
						temp="";
						form=null;
					}catch(e){
						console.log("getUploadChunk err:",e);
						if(temp){
							// 上传失败,重试3次
							if(form.error>3){
								stop = true;
								return ;
							}
							form.error=form.error?++form.error:1;							
						}else{
							stop = true;
						}
					}					
				}
				
			},
			async mergeClick(){
				try{
					const data = await merge({hash:this.hash, name:`${this.hash}.mp4`, size:2097152});
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
