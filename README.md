# 一个请求类

# 期望：

* **可扩展**，可替换请求方法, web端、node、小程序使用的请求方法不尽相同；或者同一个应用需要对接不同服务时，不同服务的差异使得无法使用同一个请求实例；
* **Loading**;
* **错误处理**，统一处理请求错误（错误是catch 完整的错误（http错误包括http层，业务错误只有业务层错误），成功是返回业务data数据）；
* **请求拦截**，对同时发起的同一请求进行拦截，最终只发出一个请求，请求回调时把所有回调执行；
* **请求缓存**，对无修改数据性质的请求结果进行缓存，并设置缓存有效时间，超过缓存有效时间时单个缓存失效，发出有修改数据性质的请求时清空缓存；
* **请求中断**, 对有相同 tag 的不同请求，中断先发出的，保留后发的；
