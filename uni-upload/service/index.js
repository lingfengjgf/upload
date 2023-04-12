const URL = 'http://192.168.1.5:3000';

export const callServer = (method, data, type) => {
	return new Promise((resolve, reject) => {
		uni.request({
			url:URL + method,
			method:type||"POST",
			data,
			dataType:"json",
			success: (res) => {
				if(res.data.code === "000"){
					resolve(res.data);
				} else {
					reject(res.data);
				}
			},
			fail: (err) => {
				reject({msg:"请求失败", err})
			}
		})
	})
}

export const callUpload = (filePath, formData) => {
	return new Promise((resolve, reject) => {
		uni.uploadFile({
			url:URL + '/api/upload',
			name:'file',
			filePath,
			formData,
			success: (res) => {
				if(res.statusCode === 200){
					const data = JSON.parse(res.data);
					if(data.code === '000'){
						resolve(data)
					}else{
						reject(data)
					}
				}
				reject(res)
			},
			fail: (err) => {
				reject(err)
			}
		})
	})
}

export const test = (data) => {
	return callServer('/api/test', data, 'GET');
}
export const handshake = (data) => {
	return callServer('/api/handshake', data);
}
export const merge = (data) => {
	return callServer('/api/merge', data);
}