/**
 * jihua 云函数 - 支持 HTTP 访问
 * 
 * 通过 CloudBase HTTP 访问服务调用此函数
 * URL: https://my-planner-d8ghrzwna9604d28a.ap-shanghai.app.tcloudbase.com/jihua-data
 */

const cloud = require('wx-server-sdk');

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
});

const db = cloud.database();

// 获取用户 openid (HTTP 访问时从 event.userInfo 获取)
const getOpenId = (event) => {
  return event.userInfo ? event.userInfo.openId : null;
};

// 获取用户数据
const getData = async (openid) => {
  try {
    const [taskRes, planRes] = await Promise.all([
      db.collection('tasks').where({ _openid: openid }).limit(1000).get(),
      db.collection('commonPlans').where({ _openid: openid }).limit(1000).get()
    ]);
    return {
      success: true,
      tasks: taskRes.data || [],
      commonPlans: planRes.data && planRes.data.length > 0 ? planRes.data : []
    };
  } catch (e) {
    return { success: false, error: '获取数据失败: ' + e.message };
  }
};

// 添加记录
const addData = async (collection, data, openid) => {
  try {
    const result = await db.collection(collection).add({
      data: { ...data, _openid: openid }
    });
    return { success: true, id: result.id };
  } catch (e) {
    return { success: false, error: '添加数据失败: ' + e.message };
  }
};

// 更新记录
const updateData = async (collection, id, data, openid) => {
  try {
    const result = await db.collection(collection)
      .where({ id: id, _openid: openid })
      .update(data);
    return { success: true, updated: result.stats.updated };
  } catch (e) {
    return { success: false, error: '更新数据失败: ' + e.message };
  }
};

// 删除记录
const removeData = async (collection, id, openid) => {
  try {
    const result = await db.collection(collection)
      .where({ id: id, _openid: openid })
      .remove();
    return { success: true, deleted: result.stats.removed };
  } catch (e) {
    return { success: false, error: '删除数据失败: ' + e.message };
  }
};

// 云函数入口
exports.main = async (event, context) => {
  const { action, collection, data, id } = event;
  const openid = getOpenId(event);

  if (!openid) {
    return { success: false, error: '未登录或无法获取用户信息' };
  }

  try {
    switch (action) {
      case 'get':
        return await getData(openid);

      case 'add':
        return await addData(collection, data, openid);

      case 'update':
        return await updateData(collection, id, data, openid);

      case 'remove':
        return await removeData(collection, id, openid);

      default:
        return { success: false, error: '未知操作: ' + action };
    }
  } catch (e) {
    return { success: false, error: e.message };
  }
};
