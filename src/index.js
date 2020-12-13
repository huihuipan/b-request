
class Request {
  constructor(globalOptions) {
    // 收集当前的请求列表(所有正在调用的接口都会存放在这里，接口返回后会同时清除所有相同请求)
    this.requestList = []
    // 需要 Loading 的请求
    this.loadingRequestList = {}
    // 收集已经发出的请求
    this.hasRequestList = {}
    // 最近的一次可缓存请求的请求结果, 若下一次请求不一样则清空
    this.cacheResult = {
      // [requestName]: { cacheTime: 缓存时间, requestName: ‘请求名称’ data：响应结果 }
    }
    
    this.globalOptions = globalOptions
    
  }

  // 生成唯一请求别名
  createOnlyName(method, api, params = {}, options = {}) {
    // console.log('getRequestName')
    let paramsStr = ''
    Object.keys(params).forEach((key) => {
      const value = params[key]
      paramsStr += `_${ key }_${ value }`
    })
    let opsStr = ''
    Object.keys(options).forEach((key) => {
      const value = options[key]
      opsStr += `_${ key }_${ value }`
    })
    // 请求名称
    const requestName = `${method}_${api}${paramsStr}${opsStr}`
    return requestName
  }

  // 继承需要重写
  // 基本请求方法，可替换
  baseRequest(method, api, params) {
    // console.log('baseRequest')
    return new Promise((resolve, reject) => {
      resolve({ method, api, params })   
    })
  }

  // 处理 业务层 状态码
  handleServeStatus(httpResult, fnSuccess, fnError) {
    const serveResult = httpResult.data
    const { code, data } = serveResult
    if (code === 200) {
      fnSuccess(data)
    } else {
      // 通常包含登录态处理...
      // console.error('ERROR 业务错误')
      fnError(serveResult)
    }
  }

  // 处理 http层 状态码
  handleHttpStatus(httpResult, fnSuccess, fnError) {
    const { statusCode } = httpResult
    if (statusCode === 200) {
      this.handleServeStatus(httpResult, fnSuccess, fnError)
    } else {
      // console.error('ERROR 服务器错误')
      fnError(httpResult)
    }
  }

  // 批量处理请求
  handleResult(targetRequestName, httpResult) {
    this.requestList.forEach((item, idx) => {
      const { requestName: rName, fnSuccess, fnError } = item
      if (rName === targetRequestName) {
        this.handleHttpStatus(httpResult, fnSuccess, fnError)
        this.requestList[idx] = null
      }
    })
    this.requestList = this.requestList.filter(item => !!item)
  }

  // 请求
  request(method, api, params, ops, fnSuccess, fnError) {
    // console.log('request')
    const options = {
      isHideLoading: false,       // 是否隐藏loading
      isSilent: false,            // 静默请求，覆盖isHideLoading 选项并且 即使接口报错也不会提示
      useCache: method === 'get', // 是否使用缓存
      cacheTime: 3000,            // 缓存有效时间，useCache 为 false 时无效，
      requireAuth: true,          // 是否依赖登录，为true时 先检测登录态，登录态失效时跳转到登录页面
      ...this.globalOptions,
      ...ops,
    }

    // 请求名称
    const requestName = this.createOnlyName(method, api, params, options) 
    const requestItem = {
      requestName,
      method,
      api,
      params,
      ops,
      fnSuccess,
      fnError,
    }
    this.requestList.push(requestItem)

    // 缓存
    if (options.useCache) {                 // 是否使用缓存
      const { cacheResult } = this
      if (cacheResult[requestName]) {      // 是否存在缓存
        const currentTime = new Date().getTime()
        if (currentTime - cacheResult[requestName].cacheTime < options.cacheTime) {   // 缓存是否在有效时间内
          this.handleResult(
            requestName,
            { ...cacheResult[requestName].httpResult, dataFrom: 'cache' },
          )
          return
        } else {
          // 缓存超时
          delete this.cacheResult[requestName]
        }
      }
    } else { // 不使用缓存，该接口可能导致数据变化，清空所有缓存
      this.cacheResult = {}
    }

    // 当前只有 1 个该请求
    if (this.requestList.filter(item => item.requestName === requestName).length === 1) {
      // console.log('request 1')
      // 没有缓存，发起请求
      this.baseRequest(method, api, params, options).then(res => {
        if (options.useCache) {
          // console.log('setCache')
          this.cacheResult[requestName] = {
            requestName,
            cacheTime: new Date().getTime(),
            httpResult: res,
          }
        }
        this.handleResult(
          requestName, 
          { ...res, dataFrom: 'request' },
        )
      }).catch(err => {
        this.cacheResult = {}
        this.handleResult(
          requestName,
          { ...err, dataFrom: 'request' }
        )
      })
      return
    } else {
      if (!options.useCache) {
        fnError({
          code: '403',
          message: 'Resubmit!',
        })
      }
    }

  }
  
  // 封装 promise
  http(method, api, data, options) {
    return new Promise((resolve, reject) => {
      this.request(
        method,
        api,
        data,
        options,
        (res) => { resolve(res) },
        (err) => { reject(err) },
      )
    })
  }

  get(api, params, ops) {
    return this.http('get', api, params, ops)
  }
  post(api, params, ops) {
    return this.http('post', api, params, ops)
  }
  put(api, params, ops) {
    return this.http('put', api, params, ops)
  }
  remove(api, params, ops) {
    return this.http('delete', api, params, ops)
  }
}

module.exports = Request