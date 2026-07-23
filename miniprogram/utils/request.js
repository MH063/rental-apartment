const TOKEN_KEY = 'token'
const REFRESH_TOKEN_KEY = 'refresh_token'

// 使用本机网卡 IP，避免 localhost 被代理软件接管（遵守规则14）
const API_BASE = 'http://192.168.68.41:8787'

// 并发 refresh 锁：多个 401 请求共享同一个 refreshToken Promise，避免 race condition
let refreshPromise = null
// 防止重复跳转登录页
let isRedirectingLogin = false

/**
 * 发起 HTTP 请求
 * 注意：每次请求必须 showLoading/hideLoading 配对
 */
function request({ url, method = 'GET', data, loading = true }) {
  if (loading) {
    wx.showLoading({ title: '加载中...' })
  }

  const token = wx.getStorageSync(TOKEN_KEY)
  let timer = null
  let completed = false

  return new Promise((resolve, reject) => {
    // 超时保护：触发后标记 completed 并 hideLoading
    timer = setTimeout(() => {
      completed = true
      if (loading) wx.hideLoading()
      wx.showToast({ title: '请求超时，请重试', icon: 'none' })
      reject(new Error('timeout'))
    }, 15000)

    wx.request({
      url: API_BASE + url,
      method,
      data,
      timeout: 15000,
      header: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: 'Bearer ' + token } : {}),
      },
      success(res) {
        // 如果已经超时，不再处理后续逻辑
        if (completed) return
        // 标记已完成，防止 complete 中重复 hideLoading
        completed = true
        clearTimeout(timer)
        // 先关闭 loading，避免后续 showToast 与 hideLoading 互斥冲突
        if (loading) wx.hideLoading()

        // 401 单独处理：先尝试刷新 token，刷新成功后重发原请求
        if (res.statusCode === 401) {
          console.warn('[request] 401 触发 token 刷新:', url)
          refreshTokenWithLock()
            .then(() => {
              // 刷新成功，重发原请求（loading 已关闭，避免重复）
              resolve(request({ url, method, data, loading: false }))
            })
            .catch((err) => {
              console.error('[request] token 刷新失败，跳转登录页:', err)
              clearAuthAndRedirect()
              reject(res.data?.error || 'ERR_AUTH_TOKEN_EXPIRED')
            })
          return
        }

        if (res.data && res.data.success) {
          resolve(res.data.data)
        } else {
          const errMsg = (res.data && res.data.error) || `请求失败(${res.statusCode})`
          wx.showToast({ title: errMsg, icon: 'none' })
          reject(new Error(errMsg))
        }
      },
      fail(err) {
        if (completed) return
        completed = true
        clearTimeout(timer)
        if (loading) wx.hideLoading()
        wx.showToast({ title: '网络异常', icon: 'none' })
        reject(err)
      },
      complete() {
        if (completed) return
        completed = true
        clearTimeout(timer)
        if (loading) wx.hideLoading()
      },
    })
  })
}

/**
 * 带并发锁的 refresh token 刷新
 * 多个并发 401 请求共享同一个 Promise，避免后端 token 复用检测导致全部失败
 */
function refreshTokenWithLock() {
  if (refreshPromise) {
    console.log('[refresh] 复用进行中的 refresh 请求')
    return refreshPromise
  }
  refreshPromise = doRefreshToken().finally(() => {
    refreshPromise = null
  })
  return refreshPromise
}

function doRefreshToken() {
  const refreshToken = wx.getStorageSync(REFRESH_TOKEN_KEY)
  if (!refreshToken) {
    console.warn('[refresh] 本地无 refresh_token')
    return Promise.reject('no refresh token')
  }
  console.log('[refresh] 调用 /api/auth/refresh')
  return new Promise((resolve, reject) => {
    wx.request({
      url: API_BASE + '/api/auth/refresh',
      method: 'POST',
      data: { refresh_token: refreshToken },
      success(res) {
        if (res.data.success) {
          wx.setStorageSync(TOKEN_KEY, res.data.data.access_token)
          wx.setStorageSync(REFRESH_TOKEN_KEY, res.data.data.refresh_token)
          console.log('[refresh] 刷新成功，已更新本地 token')
          resolve()
        } else {
          console.warn('[refresh] 后端返回失败:', res.data.error)
          reject(res.data.error)
        }
      },
      fail(err) {
        console.error('[refresh] 网络异常:', err)
        reject(err)
      },
    })
  })
}

/**
 * 清除本地认证信息并跳转登录页（防重复跳转）
 */
function clearAuthAndRedirect() {
  wx.removeStorageSync(TOKEN_KEY)
  wx.removeStorageSync(REFRESH_TOKEN_KEY)
  if (isRedirectingLogin) return
  isRedirectingLogin = true
  // 延迟跳转，避免在多请求并发时立即跳转造成卡顿
  setTimeout(() => {
    isRedirectingLogin = false
    wx.redirectTo({ url: '/pages/login/login' })
  }, 100)
}

function logout() {
  const token = wx.getStorageSync(TOKEN_KEY)
  if (token) {
    wx.request({
      url: API_BASE + '/api/auth/logout',
      method: 'POST',
      header: { Authorization: 'Bearer ' + token },
      complete: () => {
        wx.removeStorageSync(TOKEN_KEY)
        wx.removeStorageSync(REFRESH_TOKEN_KEY)
      },
    })
  } else {
    wx.removeStorageSync(TOKEN_KEY)
    wx.removeStorageSync(REFRESH_TOKEN_KEY)
  }
}

module.exports = { request, API_BASE, logout }
