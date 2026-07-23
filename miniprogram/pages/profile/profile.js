const { authStore, loadProfile, logout } = require('../../store/index')
const { houseStore, loadHouses, switchHouse } = require('../../store/index')
const { request } = require('../../utils/request')

Page({
  data: {
    showEdit: false,
    editNickname: '',
    editAvatar: '',
    editAvatarLocal: '',
    uploading: false,
    loadError: false,
  },

  onShow() {
    authStore.connect(this, 'auth')
    houseStore.connect(this, 'house')
    this.load()
  },

  async load() {
    this.setData({ loadError: false })
    try {
      await Promise.all([loadProfile(), loadHouses()])
    } catch (e) {
      console.error('[profile] 加载失败:', e)
      this.setData({ loadError: true })
    }
  },

  onRetry() {
    this.load()
  },

  // ---- 房屋操作 ----
  onHouseAction(e) {
    var id = e.currentTarget.dataset.id
    var name = e.currentTarget.dataset.name
    var isCurrent = id === this.data.house.currentHouseId
    var items = isCurrent ? ['查看详情'] : ['切换到此房屋', '查看详情', '退出房屋']
    var that = this
    wx.showActionSheet({
      itemList: items,
      success(res) {
        var tap = res.tapIndex
        if (isCurrent) {
          if (tap === 0) that.onViewHouseDetail(id)
        } else {
          if (tap === 0) that._doSwitch(id)
          else if (tap === 1) that.onViewHouseDetail(id)
          else if (tap === 2) that.onLeaveHouse(id, name)
        }
      },
    })
  },

  _doSwitch(id) {
    if (id === this.data.house.currentHouseId) return
    switchHouse(id)
    wx.showToast({ title: '已切换房屋', icon: 'success' })
  },

  onViewHouseDetail(id) {
    wx.navigateTo({ url: '/pages/config/config' })
  },

  onLeaveHouse(id, name) {
    wx.showModal({
      title: '退出房屋',
      content: '确定退出「' + name + '」？退出后可重新扫码加入。',
      confirmColor: '#ef4444',
      success(res) {
        if (res.confirm) getCurrentPages().pop()._doLeave(id)
      },
    })
  },

  async _doLeave(id) {
    try {
      await request({ url: '/api/houses/' + id + '/leave', method: 'POST' })
      wx.showToast({ title: '已退出房屋', icon: 'success' })
      this.setData({ loadError: false })
      loadHouses()
    } catch {
      wx.showToast({ title: '退出失败', icon: 'none' })
    }
  },

  onSwitchHouse(e) {
    var id = e.currentTarget.dataset.id
    if (id === this.data.house.currentHouseId) return
    switchHouse(id)
    wx.showToast({ title: '已切换房屋', icon: 'success' })
  },

  // ---- 退出登录 ----
  onLogout() {
    wx.showModal({
      title: '退出登录',
      content: '确定要退出吗？退出后需重新登录。',
      confirmColor: '#ef4444',
      success(res) {
        if (res.confirm) {
          logout()
          wx.redirectTo({ url: '/pages/login/login' })
        }
      },
    })
  },

  // ---- 编辑资料 ----
  onOpenEdit() {
    var user = this.data.auth.user || {}
    this.setData({
      showEdit: true,
      editNickname: user.nickname || '',
      editAvatar: user.avatar || '',
      editAvatarLocal: '',
    })
  },

  onCloseEdit() {
    this.setData({ showEdit: false })
  },

  onNicknameInput(e) {
    this.setData({ editNickname: e.detail.value })
  },

  async onPickAvatar() {
    var res = await wx.chooseImage({ count: 1, sizeType: ['compressed'] })
    if (!res.tempFilePaths.length) return
    var path = res.tempFilePaths[0]
    this.setData({ editAvatarLocal: path, uploading: true })
    try {
      var fs = wx.getFileSystemManager()
      var base64 = fs.readFileSync(path, 'base64')
      var up = await request({ url: '/api/upload', method: 'POST', data: { image: base64, filename: 'avatar.jpg' } })
      this.setData({ editAvatar: up.url, uploading: false })
      wx.showToast({ title: '头像已上传', icon: 'success' })
    } catch {
      this.setData({ uploading: false })
      wx.showToast({ title: '上传失败', icon: 'none' })
    }
  },

  async onSaveProfile() {
    var nickname = this.data.editNickname.trim()
    if (!nickname) return wx.showToast({ title: '昵称不能为空', icon: 'none' })
    var data = { nickname: nickname }
    if (this.data.editAvatar) data.avatar = this.data.editAvatar
    try {
      await request({ url: '/api/user/profile', method: 'PUT', data: data })
      wx.showToast({ title: '已保存', icon: 'success' })
      this.setData({ showEdit: false })
      loadProfile()
    } catch {
      wx.showToast({ title: '保存失败', icon: 'none' })
    }
  },
})
