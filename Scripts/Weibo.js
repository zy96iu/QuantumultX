//UpdateTime   2023-03-13 15:33
//@zmqcherish, @RuCu6, @ddgksf2013


//@https://github.com/RuCu6/QuanX/blob/main/Scripts/weibo.js
// 2023-03-11 08:55

const url = $request.url;
if (!$response.body) $done({});
let body = $response.body;

// 微博详情页菜单配置
const itemMenusConfig = {
  creatortypeask: false, // 转发任务
  mblog_menus_apeal: true, // 申诉
  mblog_menus_avatar_widget: false, // 用此头像挂件
  mblog_menus_bullet_shield: true, // 屏蔽弹幕
  mblog_menus_card_bg: false, // 用此卡片背景
  mblog_menus_comment_manager: true, // 评论管理
  mblog_menus_copy_url: true, // 复制链接
  mblog_menus_custom: false, // 寄微博
  mblog_menus_delete: true, // 删除
  mblog_menus_edit: true, // 编辑
  mblog_menus_edit_history: true, // 编辑记录
  mblog_menus_edit_video: true, // 编辑视频
  mblog_menus_favorite: true, // 收藏
  mblog_menus_follow: true, // 关注
  mblog_menus_home: false, // 返回首页
  mblog_menus_long_picture: true, // 生成长图
  mblog_menus_modify_visible: true, // 设置分享范围
  mblog_menus_novelty: false, // 新鲜事投稿
  mblog_menus_open_reward: false, // 赞赏
  mblog_menus_popularize: false,
  mblog_menus_promote: false, // 推广
  mblog_menus_report: true, // 投诉
  mblog_menus_shield: true, // 屏蔽
  mblog_menus_sticking: true, // 置顶
  mblog_menus_video_feedback: false, // 播放反馈
  mblog_menus_video_later: false // 可能是稍后再看
};

if (url.includes("/interface/sdk/sdkad.php")) {
  // 开屏广告
  let obj = JSON.parse(body.substring(0, body.length - 2));
  if (obj.needlocation) {
    obj.needlocation = false;
  }
  if (obj.show_push_splash_ad) {
    obj.show_push_splash_ad = false;
  }
  if (obj.background_delay_display_time) {
    obj.background_delay_display_time = 31536000; // 60 * 60 * 24 * 365 = 31536000
  }
  if (obj.lastAdShow_delay_display_time) {
    obj.lastAdShow_delay_display_time = 31536000;
  }
  if (obj.realtime_ad_video_stall_time) {
    obj.realtime_ad_video_stall_time = 0;
  }
  if (obj.realtime_ad_timeout_duration) {
    obj.realtime_ad_timeout_duration = 0;
  }
  if (obj.ads) {
    for (let item of obj.ads) {
      item.displaytime = 0;
      item.displayintervel = 31536000;
      item.allowdaydisplaynum = 0;
      item.begintime = "2040-01-01 00:00:00";
      item.endtime = "2040-01-01 23:59:59";
    }
  }
  $done({ body: JSON.stringify(obj) + "OK" });
} else {
  let obj = JSON.parse(body);
  if (url.includes("/2/cardlist") || url.includes("/2/searchall")) {
    if (obj.cards) {
      let newCards = [];
      for (let card of obj.cards) {
        let cardGroup = card.card_group;
        if (cardGroup?.length > 0) {
          let newGroup = [];
          for (let group of cardGroup) {
            if (group.mblog) {
              // 头像挂件,关注按钮
              removeAvatar(group.mblog);
            }
            let cardType = group.card_type;
            if (cardType !== 118) {
              if (card?.show_type === 3) {
                if (cardType !== 17) {
                  continue;
                }
              }
              if (!isAd(group.mblog)) {
                // 商品橱窗
                if (group.mblog?.common_struct) {
                  delete group.mblog.common_struct;
                }
                newGroup.push(group);
              }
            }
          }
          card.card_group = newGroup;
          newCards.push(card);
        } else {
          let cardType = card.card_type;
          if (card.mblog) {
            // 头像挂件,关注按钮
            removeAvatar(card.mblog);
          }
          // 9 广告
          // 17 猜你想搜
          // 58 猜你想搜偏好设置
          // 165 广告
          if ([9, 165].indexOf(cardType) !== -1) {
            if (!isAd(card.mblog)) {
              newCards.push(card);
            }
          } else {
            if ([17, 58, 180, 1007].indexOf(cardType) !== -1) {
              continue;
            }
            newCards.push(card);
          }
        }
      }
      obj.cards = newCards;
    }
  } else if (url.includes("/2/checkin/show")) {
    // 首页签到
    if (obj.show) {
      obj.show = 0;
    }
  } else if (url.includes("/2/client/publisher_list")) {
    // 首页右上角按钮
    if (obj.elements) {
      obj.elements = obj.elements.filter(
        (a) =>
          a.app_name === "写微博" ||
          a.app_name === "图片" ||
          a.app_name === "视频"
      );
    }
  } else if (url.includes("/2/comments/build_comments")) {
    // 评论区
    if (obj.datas) {
      let items = obj.datas;
      if (items.length > 0) {
        let newItems = [];
        for (let item of items) {
          if (!isAd(item.data)) {
            // 微博伪装评论
            if (item.data.user) {
              // 头像挂件,关注按钮
              removeAvatar(item.data);
              if (
                item.data.user.name === "超话社区" ||
                item.data.user.name === "微博视频"
              ) {
                continue;
              }
            }
            // 评论气泡
            if (item.data?.comment_bubble) {
              delete item.data.comment_bubble;
            }
            // 评论弹幕
            if (item.data?.comment_bullet_screens_message) {
              delete item.data.comment_bullet_screens_message;
            }
            // 热评小图标 弹幕 首评
            if (item.data?.hot_icon) {
              delete item.data.hot_icon;
            }
            // 会员气泡按钮
            if (item.data?.vip_button) {
              delete item.data.vip_button;
            }
            // 相关内容,过滤提示
            if (
              item?.adType === "相关内容" ||
              item?.adType === "推荐" ||
              item?.type === 6 ||
              item?.type === 15
            ) {
              continue;
            }
            newItems.push(item);
          }
        }
        obj.datas = newItems;
      }
    } else if (obj.root_comments) {
      let items = obj.root_comments;
      if (items.length > 0) {
        let newItems = [];
        for (let item of items) {
          if (!isAd(item)) {
            // 微博伪装评论
            if (item.user) {
              // 头像挂件,关注按钮
              removeAvatar(item);
              if (
                item.user.name === "超话社区" ||
                item.user.name === "微博视频"
              ) {
                continue;
              }
            }
            // 评论气泡
            if (item?.comment_bubble) {
              delete item.comment_bubble;
            }
            // 评论弹幕
            if (item?.comment_bullet_screens_message) {
              delete item.comment_bullet_screens_message;
            }
            // 热评小图标 弹幕 首评
            if (item?.hot_icon) {
              delete item.hot_icon;
            }
            // 会员气泡按钮
            if (item?.vip_button) {
              delete item.vip_button;
            }
            newItems.push(item);
          }
        }
        obj.root_comments = newItems;
      }
    }
  } else if (url.includes("/2/messageflow/notice")) {
    // 消息动态页
    if (obj.messages) {
      let newMsgs = [];
      for (let msg of obj.messages) {
        if (msg.msg_card?.ad_tag) {
          continue;
        } else {
          newMsgs.push(msg);
        }
      }
      obj.messages = newMsgs;
    }
  } else if (url.includes("/2/page")) {
    // 搜索页列表,超话
    if (obj.cards) {
      if (obj.cards[0].card_group) {
        obj.cards[0].card_group = obj.cards[0].card_group.filter(
          (c) =>
            !(
              c?.actionlog?.ext?.includes("ads_word") ||
              c?.itemid?.includes("t:51") ||
              c?.itemid?.includes("ads_word")
            )
        );
      }
      obj.cards = obj.cards.filter(
        (i) =>
          !(
            i.itemid?.includes("feed_-_invite") || // 超话里的好友
            i.itemid?.includes("infeed_friends_recommend") || // 好友关注
            i.itemid?.includes("infeed_may_interest_in") || // 你可能感兴趣的超话
            i.itemid?.includes("infeed_pagemanual3") || // 手动区域3
            i.itemid?.includes("infeed_weibo_mall") || // 微博小店
            i?.mblog?.mblogtypename?.includes("广告")
          )
      );
    } else if (obj.card_group) {
      obj.card_group = obj.card_group.filter((i) =>
        i?.desc?.includes("你可能感兴趣的超话")
      );
    }
  } else if (url.includes("/2/profile/container_timeline")) {
    // 个人主页信息流
    if (obj.items) {
      let newItems = [];
      for (let item of obj.items) {
        if (item.category === "card") {
          // 筛选按钮
          if (item.data.card_type === 216) {
            newItems.push(item);
          }
        } else if (item.category === "group") {
          // 遍历group,保留置顶微博
          for (let ii of item.items) {
            if (ii.category === "feed") {
              // 头像挂件,关注按钮
              removeAvatar(ii.data);
              newItems.push(item);
            }
          }
        } else if (item.category === "feed") {
          if (!isAd(item.data)) {
            // 头像挂件,关注按钮
            removeAvatar(item.data);
            // 商品橱窗
            if (item.data?.common_struct) {
              delete item.data.common_struct;
            }
            newItems.push(item);
          }
        }
      }
      obj.items = newItems;
    }
  } else if (url.includes("/2/profile/me")) {
    // 我的页面
    if (obj.vipHeaderBgImage) {
      delete obj.vipHeaderBgImage;
    }
    if (obj.items) {
      let newItems = [];
      for (let item of obj.items) {
        let itemId = item.itemId;
        if (itemId === "profileme_mine") {
          if (item.header) {
            delete item.header.vipView;
            delete item.header.vipCenter;
            delete item.header.vipIcon;
          }
          for (let d of item.items) {
            if (d.itemId === "mainnums_friends") {
              let s = d.click.modules[0].scheme;
              d.click.modules[0].scheme = s.replace(
                "231093_-_selfrecomm",
                "231093_-_selffollowed"
              );
            }
          }
          newItems.push(item);
        } else if (itemId === "100505_-_top8") {
          if (item.items) {
            item.items = item.items.filter(
              (i) =>
                i.itemId === "100505_-_album" || // 我的相册
                i.itemId === "100505_-_like" || // 赞/收藏
                i.itemId === "100505_-_watchhistory" || // 浏览记录
                i.itemId === "100505_-_draft" // 草稿箱
              // i.itemId === "100505_-_pay" || // 我的钱包
              // i.itemId === "100505_-_ordercenter" || // 我的订单
              // i.itemId === "100505_-_productcenter" || // 创作中心
              // i.itemId === "100505_-_promote" || // 广告中心
            );
          }
          newItems.push(item);
        } else if (itemId === "100505_-_manage") {
          if (item.style) {
            delete item.style;
          }
          // 移除分隔符的点点点
          if (item.images) {
            delete item.images;
          }
          newItems.push(item);
        } else if (itemId === "100505_-_manage2") {
          // 移除面板样式
          if (item.footer) {
            delete item.footer;
          }
          // 移除框内推广
          if (item.body) {
            delete item.body;
          }
          newItems.push(item);
        } else if (
          itemId === "100505_-_chaohua" ||
          itemId === "100505_-_recentlyuser"
        ) {
          newItems.push(item);
        } else {
          // 其他项目全部移除
          continue;
        }
      }
      obj.items = newItems;
    }
  } else if (url.includes("/2/push/active")) {
    // 首页右上角红包图标
    if (obj?.feed_redpacket) {
      obj.feed_redpacket.starttime = "2208960000";
      obj.feed_redpacket.interval = "31536000";
      obj.feed_redpacket.endtime = "2209046399";
    }
  } else if (url.includes("/2/search/")) {
    // 搜索页信息流
    if (url.includes("container_timeline")) {
      if (obj.items) {
        let newItems = [];
        for (let item of obj.items) {
          if (item.category === "feed") {
            if (!isAd(item.data)) {
              // 头像挂件,关注按钮
              removeAvatar(item.data);
              newItems.push(item);
            }
          } else {
            if (!checkSearchWindow(item)) {
              newItems.push(item);
            }
          }
          obj.items = newItems;
        }
      }
      if (obj?.loadedInfo) {
        delete obj?.loadedInfo;
      }
    } else if (url.includes("finder")) {
      let channels = obj.channelInfo.channels;
      if (channels) {
        for (let channel of channels) {
          let payload = channel.payload;
          if (payload) {
            if (payload.loadedInfo) {
              // 去除搜索框填充词
              if (payload.loadedInfo.searchBarContent) {
                delete payload.loadedInfo.searchBarContent;
              }
              // 去除搜索背景图片
              if (payload.loadedInfo.headerBack?.channelStyleMap) {
                delete payload.loadedInfo.headerBack.channelStyleMap;
              }
            }
            if (payload.items) {
              let newItems = [];
              for (let item of payload.items) {
                if (item.category === "feed") {
                  if (!isAd(item.data)) {
                    // 头像挂件,关注按钮
                    removeAvatar(item.data);
                    newItems.push(item);
                  }
                } else {
                  if (!checkSearchWindow(item)) {
                    newItems.push(item);
                  }
                }
              }
              payload.items = newItems;
            }
          }
        }
      }
    }
  } else if (
    url.includes("/2/statuses/container_timeline?") ||
    url.includes("/2/statuses/container_timeline_unread") ||
    url.includes("/2/statuses/container_timeline_hot")
  ) {
    // 首页关注tab信息流
    if (obj.loadedInfo?.headers) {
      delete obj.loadedInfo.headers;
    }
    // 商品橱窗
    if (obj?.common_struct) {
      delete obj?.common_struct;
    }
    if (obj.items) {
      let newItems = [];
      for (let item of obj.items) {
        if (!isAd(item.data)) {
          if (item.category === "feed") {
            // 头像挂件,关注按钮
            removeAvatar(item.data);
            if (item.data?.retweeted_status) {
              removeAvatar(item.data.retweeted_status);
            }
            // 商品橱窗
            if (item.data?.common_struct) {
              delete item.data.common_struct;
            }
            newItems.push(item);
          } else if (item.category === "feedBiz") {
            // 管理特别关注按钮
            newItems.push(item);
          } else {
            // 移除所有的推广
            continue;
          }
        }
      }
      obj.items = newItems;
    }
  } else if (url.includes("/2/statuses/container_timeline_topic")) {
    // 超话信息流
    if (obj.items) {
      let newItems = [];
      for (let item of obj.items) {
        if (item?.items) {
          delete item.items;
        }
        if (item.category === "feed") {
          if (item.data) {
            // 头像挂件,关注按钮
            removeAvatar(item.data);
          }
          newItems.push(item);
        } else {
          // 移除所有的推广
          continue;
        }
      }
      obj.items = newItems;
    }
  } else if (url.includes("/2/statuses/show")) {
    // 头像挂件,关注按钮
    removeAvatar(obj);
    // 商品橱窗
    if (obj?.common_struct) {
      delete obj.common_struct;
    }
    // 循环引用中的商品橱窗
    if (obj.text?.common_struct) {
      delete obj.text.common_struct;
    }
  } else if (url.includes("/2/statuses/unread_hot_timeline")) {
    // 首页推荐tab信息流
    for (let s of ["ad", "advertises", "trends", "headers"]) {
      if (obj[s]) {
        delete obj[s];
      }
    }
    if (obj.statuses) {
      let newStatuses = [];
      for (let s of obj.statuses) {
        if (!isAd(s)) {
          // 头像挂件,关注按钮
          removeAvatar(s);
          // 移除拓展信息,绿洲
          if (s?.common_struct) {
            delete s.common_struct;
          }
          newStatuses.push(s);
        }
      }
      obj.statuses = newStatuses;
    }
  } else if (url.includes("/2/statuses/extend")) {
    // 微博详情页
    if (obj?.trend?.extra_struct?.extBtnInfo?.btn_picurl?.includes("ad")) {
      delete obj.trend;
    }
    if (obj.trend?.titles) {
      let title = obj.trend.titles.title;
      if (["博主好物种草", "相关推荐"].indexOf(title) !== -1) {
        delete obj.trend;
      }
    }
    // 关注提醒
    if (obj?.follow_data) {
      delete obj.follow_data;
    }
    // 公益赞赏
    if (obj?.reward_info) {
      delete obj.reward_info;
    }
    // 移除拓展卡片
    if (obj?.extend_info) {
      delete obj.extend_info;
    }
    // 移除超话新帖和新用户通知
    if (obj?.page_alerts) {
      delete obj.page_alerts;
    }
    if (obj.custom_action_list) {
      let newActions = [];
      for (let item of obj.custom_action_list) {
        let type = item.type;
        let add = itemMenusConfig[type];
        if (type === "mblog_menus_copy_url") {
          newActions.unshift(item);
        } else if (add) {
          newActions.push(item);
        }
      }
      obj.custom_action_list = newActions;
    }
  } else if (url.includes("/2/video/tiny_stream_video_list")) {
    if (obj.statuses) {
      obj.statuses = obj.statuses.filter((m) => !(m.mblogtypename === "广告"));
    }
  } else if (url.includes("/2/!/huati/discovery_home_bottom_channels")) {
    // 超话左上角,右上角图标
    if (obj.button_configs) {
      delete obj.button_configs;
    }
    // 广场页
    if (obj.channelInfo.channel_list) {
      obj.channelInfo.channel_list = obj.channelInfo.channel_list.filter(
        (t) => t.title !== "广场"
      );
    }
  } else if (url.includes("/wbapplua/wbpullad.lua")) {
    // 开屏广告
    if (obj.cached_ad.ads) {
      for (let item of obj.cached_ad.ads) {
        item.start_date = 2208960000; // Unix 时间戳 2040-01-01 00:00:00
        item.show_count = 0;
        item.duration = 0; // 60 * 60 * 24 * 365 = 31536000
        item.end_date = 2209046399; // Unix 时间戳 2040-01-01 23:59:59
      }
    }
  }
  $done({ body: JSON.stringify(obj) });
}

// 判断信息流
function isAd(data) {
  if (data) {
    if (data.mblogtypename === "广告") {
      return true;
    }
    if (data.mblogtypename === "热推") {
      return true;
    }
    if (data.promotion?.type === "ad") {
      return true;
    }
  }
  return false;
}

// 移除头像挂件,关注按钮
function removeAvatar(data) {
  if (data?.cardid) {
    delete data.cardid;
  }
  if (data?.buttons) {
    delete data.buttons;
  }
  if (data?.pic_bg_new) {
    delete data.pic_bg_new;
  }
  if (data?.user?.cardid) {
    delete data.user.cardid;
  }
  if (data?.user?.avatar_extend_info) {
    delete data.user.avatar_extend_info;
  }
  if (data?.user?.icons) {
    delete data.user.icons;
  }
  if (data?.user?.avatargj_id) {
    delete data.user.avatargj_id;
  }
  return data;
}

function checkSearchWindow(item) {
  if (item.category) {
    // 搜索页中间的热议话题、热门人物
    if (item.category === "group") {
      return true;
    } else {
      if (item.category !== "card") {
        return false;
      }
    }
  }
  if (
    item.data?.card_type === 19 || // 找人 热议 本地
    item.data?.card_type === 118 || // finder_window 横版大图
    item.data?.card_type === 208 || // 实况热聊
    item.data?.card_type === 217 ||
    item.data?.card_type === 1005 ||
    item.data?.itemid === "more_frame" ||
    item.data?.mblog?.page_info?.actionlog?.source?.includes("ad")
  ) {
    return true;
  }
  return false;
}


///##### ======== 分割线 ======== ######///


//@https://github.com/ddgksf2013/Scripts
> 应用名称：墨鱼自用微博&微博国际版净化脚本
> 脚本作者：@ddgksf2013, @Zmqcherish 
> 微信账号：墨鱼手记
> 更新时间：2022-03-09
> 通知频道：https://t.me/ddgksf2021
> 贡献投稿：https://t.me/ddgksf2013_bot
> 原作者库：https://github.com/zmqcherish
> 问题反馈：ddgksf2013@163.com
> 特别提醒：如需转载请注明出处，谢谢合作！
> 脚本声明：本脚本是在Zmqcherish原创基础上优化自用
> 脚本声明：若有侵犯原作者权利，请邮箱联系删除  
//###=== weibo_search_info ===###
{"data":{"expiration_time":"86400","cards":[{"tip":"\u641c\u7d22\u5fae\u535a","word":""}]},"info":"","retcode":0}

//###=== weibo_search_topic ===###
{"data":[],"info":"","retcode":0,"ext":{"search_hot_simple":{"title":"\u70ed\u95e8\u641c\u7d22","desc":"","more":"\u66f4\u591a\u70ed\u641c"},"search_hot":{"title":"\u5fae\u535a\u70ed\u641c\u699c","desc":"\u5b9e\u65f6\u70ed\u70b9\uff0c\u6bcf\u5206\u949f\u66f4\u65b0\u4e00\u6b21","more":""},"search_city":{"title":"\u540c\u57ce\u70ed\u70b9","desc":"","more":""}}}


//### === Weibo === ###
const version = 'V2.0.103';

const mainConfig={isDebug:!1,author:"ddgksf2013",removeHomeVip:!0,removeHomeCreatorTask:!0,removeRelate:!0,removeGood:!0,removeFollow:!0,modifyMenus:!0,removeRelateItem:!1,removeRecommendItem:!0,removeRewardItem:!0,removeLiveMedia:!0,removeNextVideo:!1,removePinedTrending:!0,removeInterestFriendInTopic:!1,removeInterestTopic:!1,removeInterestUser:!0,removeLvZhou:!0,removeSearchWindow:!0,profileSkin1:null,profileSkin2:null,tabIconVersion:0,tabIconPath:""},itemMenusConfig={creator_task:!1,mblog_menus_custom:!1,mblog_menus_video_later:!0,mblog_menus_comment_manager:!0,mblog_menus_avatar_widget:!1,mblog_menus_card_bg:!1,mblog_menus_long_picture:!0,mblog_menus_delete:!0,mblog_menus_edit:!0,mblog_menus_edit_history:!0,mblog_menus_edit_video:!0,mblog_menus_sticking:!0,mblog_menus_open_reward:!0,mblog_menus_novelty:!1,mblog_menus_favorite:!0,mblog_menus_promote:!0,mblog_menus_modify_visible:!0,mblog_menus_copy_url:!0,mblog_menus_follow:!0,mblog_menus_video_feedback:!0,mblog_menus_shield:!0,mblog_menus_report:!0,mblog_menus_apeal:!0,mblog_menus_home:!0},modifyCardsUrls=["/cardlist","video/community_tab","/searchall"],modifyStatusesUrls=["statuses/friends/timeline","statuses_unread_hot_timeline","statuses/unread_friends_timeline","statuses/unread_hot_timeline","groups/timeline","statuses/friends_timeline"],otherUrls={"/profile/me":"removeHome","/statuses/extend":"itemExtendHandler","/video/remind_info":"removeVideoRemind","/checkin/show":"removeCheckin","/live/media_homelist":"removeMediaHomelist","/comments/build_comments":"removeComments","/container/get_item":"containerHandler","/profile/container_timeline":"userHandler","/video/tiny_stream_video_list":"nextVideoHandler","/2/statuses/video_mixtimeline":"nextVideoHandler","video/tiny_stream_mid_detail":"nextVideoHandler","/!/client/light_skin":"tabSkinHandler","/littleskin/preview":"skinPreviewHandler","/search/finder":"removeSearchMain","/search/container_timeline":"removeSearch","/search/container_discover":"removeSearch","/2/messageflow":"removeMsgAd","/2/page?":"removePage","/statuses/unread_topic_timeline":"topicHandler","square&pageDataType":"squareHandler","/statuses/container_timeline_topic":"removeMain","/statuses/container_timeline":"removeMainTab","wbapplua/wbpullad.lua":"removeLuaScreenAds","interface/sdk/sdkad.php":"removePhpScreenAds","ct=feed&a=trends":"removeTopics",user_center:"modifiedUserCenter","a=get_coopen_ads":"removeIntlOpenAds","php?a=search_topic":"removeSearchTopic","v1/ad/realtime":"removeRealtimeAd"};function getModifyMethod(e){for(let t of modifyCardsUrls)if(e.indexOf(t)>-1)return"removeCards";for(let o of modifyStatusesUrls)if(e.indexOf(o)>-1)return"removeTimeLine";for(let[i,r]of Object.entries(otherUrls))if(e.indexOf(i)>-1)return r;return null}function removeRealtimeAd(e){return delete e.ads,e.code=4016,e}function removeIntlOpenAds(e){return e.data&&0!==e.data.length&&(e.data.ad_list=[],e.data.gdt_video_ad_ios=[],e.data.display_ad=0,e.data.ad_ios_id=null,e.data.app_ad_ios_id=null,e.data.reserve_ad_ios_id="",e.data.reserve_app_ad_ios_id="",e.data.ad_duration=604800,e.data.ad_cd_interval=604800,e.data.pic_ad=[]),e}function removeSearchTopic(e){return e.data&&0!==e.data.length&&(e.data=Object.values(e.data).filter(e=>"searchtop"!=e.type)),e}function modifiedUserCenter(e){return e.data&&0!==e.data.length&&e.data.cards&&(e.data.cards=Object.values(e.data.cards).filter(e=>"personal_vip"!=e.items[0].type)),e}function removeTopics(e){return e.data&&(e.data.order=["search_topic","native_content"]),e}function isAd(e){return!!e&&("广告"==e.mblogtypename||"热推"==e.mblogtypename||e.promotion?.type=="ad"||e.page_info?.actionlog?.source=="ad"||e.content_auth_info?.content_auth_title=="广告")}function squareHandler(e){return e.items,e}function removeMainTab(e){if(e.loadedInfo&&e.loadedInfo.headers&&delete e.loadedInfo.headers,!e.items)return e;let t=[];for(let o of e.items)isAd(o.data)||(o.data?.common_struct&&delete o.data.common_struct,o.category?"group"!=o.category?t.push(o):-1!=JSON.stringify(o.items).indexOf("profile_top")&&t.push(o):t.push(o));return e.items=t,log("removeMainTab success"),e}function removeMain(e){if(e.loadedInfo&&e.loadedInfo.headers&&delete e.loadedInfo.headers,!e.items)return e;let t=[];for(let o of e.items)if("feed"==o.category)isAd(o.data)||t.push(o);else if("group"==o.category){if(o.items.length>0&&o.items[0].data?.itemid?.includes("search_input"))o.items=o.items.filter(e=>e?.data?.itemid?.includes("mine_topics")||e?.data?.itemid?.includes("search_input")),o.items[0].data.hotwords=[{word:"搜索超话",tip:""}],t.push(o);else{if(o.items.length>0&&o.items[0].data?.itemid?.includes("top_title"))continue;o.items.length>0?o.items=Object.values(o.items).filter(e=>"feed"==e.category):t.push(o)}}else -1==[202,200].indexOf(o.data.card_type)&&t.push(o);return e.items=t,log("removeMain success"),e}function topicHandler(e){let t=e.cards;if(!t||!mainConfig.removeUnfollowTopic&&!mainConfig.removeUnusedPart)return e;let o=[];for(let i of t){let r=!0;if(i.mblog){let n=i.mblog.buttons;mainConfig.removeUnfollowTopic&&n&&"follow"==n[0].type&&(r=!1)}else{if(!mainConfig.removeUnusedPart)continue;if("bottom_mix_activity"==i.itemid)r=!1;else if(i?.top?.title=="正在活跃")r=!1;else if(200==i.card_type&&i.group)r=!1;else{let a=i.card_group;if(!a)continue;if(["guess_like_title","cats_top_title","chaohua_home_readpost_samecity_title"].indexOf(a[0].itemid)>-1)r=!1;else if(a.length>1){let d=[];for(let s of a)-1==["chaohua_discovery_banner_1","bottom_mix_activity"].indexOf(s.itemid)&&d.push(s);i.card_group=d}}}r&&o.push(i)}return e.cards=o,log("topicHandler success"),e}function removeSearchMain(e){let t=e.channelInfo.channels;if(!t)return e;let o=[];for(let i of t)i.payload&&(removeSearch(i.payload),o.push(i));return e.channelInfo.channels=o,log("remove_search main success"),e}function checkSearchWindow(e){return!!mainConfig.removeSearchWindow&&"card"==e.category&&(e.data?.itemid=="finder_window"||e.data?.itemid=="more_frame"||e.data?.card_type==208||e.data?.card_type==217||e.data?.card_type==101||e.data?.card_type==19||e.data?.mblog?.page_info?.actionlog?.source?.includes("ad"))}function removeSearch(e){if(!e.items)return e;let t=[];for(let o of e.items)if("feed"==o.category)isAd(o.data)||t.push(o);else{if("group"==o.category)continue;checkSearchWindow(o)||t.push(o)}return e.items=t,e.loadedInfo&&(e.loadedInfo.searchBarContent=[],e.loadedInfo.headerBack&&(e.loadedInfo.headerBack.channelStyleMap={})),log("remove_search success"),e}function removeMsgAd(e){if(!e.messages)return;let t=[];for(let o of e.messages)!o.msg_card?.ad_tag&&t.push(o);return e.messages=t,e}function removePage(e){return removeCards(e),mainConfig.removePinedTrending&&e.cards&&e.cards.length>0&&e.cards[0].card_group&&(e.cards[0].card_group=e.cards[0].card_group.filter(e=>!(e?.actionlog?.ext?.includes("ads_word")||e?.itemid?.includes("t:51")||e?.itemid?.includes("ads_word")))),e}function removeCards(e){if(e.hotwords&&(e.hotwords=[]),!e.cards)return;let t=[];for(let o of e.cards){if(17==o.card_type||58==o.card_type)continue;let i=o.card_group;if(i&&i.length>0){let r=[];for(let n of i)118==n.card_type||isAd(n.mblog)||-1!=JSON.stringify(n).indexOf("res_from:ads")||r.push(n);o.card_group=r,t.push(o)}else{let a=o.card_type;if([9,165].indexOf(a)>-1)isAd(o.mblog)||t.push(o);else{if([1007,180].indexOf(a)>-1)continue;t.push(o)}}}e.cards=t}function lvZhouHandler(e){if(!mainConfig.removeLvZhou||!e)return;let t=e.common_struct;if(!t)return;let o=[];for(let i of t)"绿洲"!=i.name&&o.push(i);e.common_struct=o}function isBlock(e){let t=mainConfig.blockIds||[];if(0===t.length)return!1;let o=e.user.id;for(let i of t)if(i==o)return!0;return!1}function removeTimeLine(e){for(let t of["ad","advertises","trends","headers"])e[t]&&delete e[t];if(!e.statuses)return;let o=[];for(let i of e.statuses)isAd(i)||(lvZhouHandler(i),i.common_struct&&delete i.common_struct,i.category?"group"!=i.category&&o.push(i):o.push(i));e.statuses=o}function removeHomeVip(e){return e.header&&e.header.vipView&&(e.header.vipView=null),e}function removeVideoRemind(e){e.bubble_dismiss_time=0,e.exist_remind=!1,e.image_dismiss_time=0,e.image="",e.tag_image_english="",e.tag_image_english_dark="",e.tag_image_normal="",e.tag_image_normal_dark=""}function itemExtendHandler(e){if((mainConfig.removeRelate||mainConfig.removeGood)&&e.trend&&e.trend.titles){let t=e.trend.titles.title;mainConfig.removeRelate&&"相关推荐"===t?delete e.trend:mainConfig.removeGood&&"博主好物种草"===t&&delete e.trend}mainConfig.removeFollow&&e.follow_data&&(e.follow_data=null),mainConfig.removeRewardItem&&e.reward_info&&(e.reward_info=null),e.page_alerts&&(e.page_alerts=null);try{e.trend.extra_struct.extBtnInfo.btn_picurl.indexOf("timeline_icon_ad_delete")>-1&&delete e.trend}catch(o){}if(mainConfig.modifyMenus&&e.custom_action_list){let i=[];for(let r of e.custom_action_list){let n=r.type,a=itemMenusConfig[n];void 0===a?i.push(r):"mblog_menus_copy_url"===n?i.unshift(r):a&&i.push(r)}e.custom_action_list=i}}function updateFollowOrder(e){try{for(let t of e.items)if("mainnums_friends"===t.itemId){let o=t.click.modules[0].scheme;t.click.modules[0].scheme=o.replace("231093_-_selfrecomm","231093_-_selffollowed"),log("updateFollowOrder success");return}}catch(i){console.log("updateFollowOrder fail")}}function updateProfileSkin(e,t){try{let o=mainConfig[t];if(!o)return;let i=0;for(let r of e.items)if(r.image)try{dm=r.image.style.darkMode,"alpha"!=dm&&(r.image.style.darkMode="alpha"),r.image.iconUrl=o[i++],r.dot&&(r.dot=[])}catch(n){}log("updateProfileSkin success")}catch(a){console.log("updateProfileSkin fail")}}function removeHome(e){if(!e.items)return e;let t=[];for(let o of e.items){let i=o.itemId;if("profileme_mine"==i)mainConfig.removeHomeVip&&(o=removeHomeVip(o)),o.header?.vipIcon&&delete o.header.vipIcon,updateFollowOrder(o),t.push(o);else if("100505_-_top8"==i)updateProfileSkin(o,"profileSkin1"),t.push(o);else if("100505_-_newcreator"==i)"grid"==o.type?(updateProfileSkin(o,"profileSkin2"),t.push(o)):mainConfig.removeHomeCreatorTask||t.push(o);else{if("100505_-_chaohua"!=i&&"100505_-_manage"!=i&&"100505_-_recentlyuser"!=i)continue;o.images?.length>0&&(o.images=o.images.filter(e=>"100505_-_chaohua"==e.itemId||"100505_-_recentlyuser"==e.itemId)),t.push(o)}}return e.items=t,e}function removeCheckin(e){log("remove tab1签到"),e.show=0}function removeMediaHomelist(e){mainConfig.removeLiveMedia&&(log("remove 首页直播"),e.data={})}function removeComments(e){let t=["广告","廣告","相关内容","推荐","热推","推薦"],o=e.datas||[];if(0===o.length)return;let i=[];for(let r of o){let n=r.adType||"";-1==t.indexOf(n)&&6!=r.type&&i.push(r)}log("remove 评论区相关和推荐内容"),e.datas=i}function containerHandler(e){mainConfig.removeInterestFriendInTopic&&"超话里的好友"===e.card_type_name&&(log("remove 超话里的好友"),e.card_group=[]),mainConfig.removeInterestTopic&&e.itemid&&(e.itemid.indexOf("infeed_may_interest_in")>-1?(log("remove 感兴趣的超话"),e.card_group=[]):e.itemid.indexOf("infeed_friends_recommend")>-1&&(log("remove 超话好友关注"),e.card_group=[]))}function userHandler(e){if(e=removeMainTab(e),!mainConfig.removeInterestUser||!e.items)return e;let t=[];for(let o of e.items){let i=!0;if("group"==o.category)try{"可能感兴趣的人"==o.items[0].data.desc&&(i=!1)}catch(r){}i&&(o.data?.common_struct&&delete o.data.common_struct,t.push(o))}return e.items=t,log("removeMain sub success"),e}function nextVideoHandler(e){if(!e.statuses)return e;let t=[];for(let o of e.statuses)if(!isAd(o)){let i=["forward_redpacket_info","shopping","float_info","tags"];for(let r of i)o.video_info?.[r]&&delete o.video_info[r];t.push(o)}return e.statuses=t,log("removeMainTab Success"),e}function tabSkinHandler(e){try{let t=mainConfig.tabIconVersion;if(e.data.canUse=1,!t||!mainConfig.tabIconPath||t<100)return;let o=e.data.list;for(let i of o)i.version=t,i.downloadlink=mainConfig.tabIconPath;log("tabSkinHandler success")}catch(r){log("tabSkinHandler fail")}}function skinPreviewHandler(e){e.data.skin_info.status=1}function removeLuaScreenAds(e){if(!e.cached_ad)return e;for(let t of e.cached_ad.ads)t.start_date=1893254400,t.show_count=0,t.duration=0,t.end_date=1893340799;return e}function removePhpScreenAds(e){if(!e.ads)return e;for(let t of(e.show_push_splash_ad=!1,e.background_delay_display_time=0,e.lastAdShow_delay_display_time=0,e.realtime_ad_video_stall_time=0,e.realtime_ad_timeout_duration=0,e.ads))t.displaytime=0,t.displayintervel=86400,t.allowdaydisplaynum=0,t.displaynum=0,t.displaytime=1,t.begintime="2029-12-30 00:00:00",t.endtime="2029-12-30 23:59:59";return e}function log(e){mainConfig.isDebug&&console.log(e)}var body=$response.body,url=$request.url;let method=getModifyMethod(url);if(method){log(method);var func=eval(method);let data=JSON.parse(body.match(/\{.*\}/)[0]);new func(data),body=JSON.stringify(data),"removePhpScreenAds"==method&&(body=JSON.stringify(data)+"OK")}$done({body});
