import Taro, { Component } from '@tarojs/taro'
import { View, Text, Image, Slider } from '@tarojs/components'
import { connect } from '@tarojs/redux'
import eventEmitter from '../../utils/eventEmitter'
import * as Events from '../../constants/event-types'
import { getGlobalData } from '../../utils'
import { updateState } from '../../actions'

import coverImg from '../../assets/image/logo.png'
import './playDetail.scss'

const playOrderIcon = ['icon-list-loop', 'icon-single-loop', 'icon-bofangye-caozuolan-suijibofang']

const mapStateToProps = ({ main }) => ({
  main
})
const mapDispatchToProps = ({
  onUpdateState: updateState
})
@connect(mapStateToProps, mapDispatchToProps)
class PlayDetail extends Component {
  static options = {
    addGlobalClass: true
  }
  constructor() {
    super(...arguments)
    this.state = {
      percent: 0,
      duration: 0,
      currentTime: 0,
      transform: `animation: imgRotate 12s linear infinite;`
    }
    this.audio = null
  }
  componentDidMount() {
    this.audio = getGlobalData('backgroundAudioManager')
    this.audio.onTimeUpdate(() => {
      this.getAudioPlayPercent()
    })
  }
  componentWillReceiveProps(nextProps) {
    let { main } = nextProps
    if (!main.playState && main.UIPage) {
      this.getAudioPlayPercent()
    }
  }
  goBack() {
    this.props.onUpdateState('main', { UIPage: false })
  }
  // 实时获取音频播放进度
  getAudioPlayPercent() {
    if (this.audio && this.audio.src) {
      let duration = this.audio.duration,
        currentTime = this.audio.currentTime;
      let playPercent = currentTime / duration;
      this.setState({
        duration: duration,
        currentTime: currentTime,
        percent: (playPercent * 100).toFixed(6),
      })
    }
  }
  // 计算时间
  formatSeconds(value) {
    let theTime = parseInt(value || 0),
      theTime1 = 0,
      theTime2 = 0
    if (theTime >= 60) {
      theTime1 = parseInt(theTime / 60)
      theTime = parseInt(theTime % 60)
      if (theTime1 >= 60) {
        theTime2 = parseInt(theTime1 / 60)
        theTime1 = parseInt(theTime1 % 60)
      }
    }
    let result
    if (parseInt(theTime) > 9) {
      result = '' + parseInt(theTime) + ''
    } else {
      result = '0' + parseInt(theTime) + ''
    }
    if (theTime1 > 0) {
      if (parseInt(theTime1) > 9) {
        result = '' + parseInt(theTime1) + ':' + result
      } else {
        result = '0' + parseInt(theTime1) + ':' + result
      }
    } else {
      result = '00:' + result;
    }
    if (theTime2 > 0) {
      result = '' + parseInt(theTime2) + ':' + result
    }
    return result
  }
  // 进度条拖动结束触发事件
  onChangePercent(e) {
    let percent = e.detail.value,
      duration = this.state.duration
    let currentTime = percent / 100 * duration
    this.setState({
      percent: percent,
      currentTime: currentTime
    })
    this.audio.seek(currentTime)
  }
  // 进度条拖动中触发事件
  onChangingPercent(e) {
    let percent = e.detail.value
    this.setState({
      percent: percent
    })
    if (!this.props.main.playState) {
      let duration = this.state.duration,
        currentTime = percent / 100 * duration
      this.setState({
        currentTime: currentTime
      })
    }
  }
  switchPlay(state) {
    let audioSrc = this.audio.src
    if (this.audio && audioSrc && audioSrc.indexOf('/null') == -1) {
      if (state) {
        this.audio.play()
      } else {
        this.audio.pause()
      }
      this.props.onUpdateState('main', { playState: state })
    }
  }
  // 切换播放类型
  switchOrder() {
    eventEmitter.trigger(Events.SWITCHORDER)
  }
  // 切换歌曲
  playNext(type) {
    eventEmitter.trigger(Events.NEXT, type)
  }
  // 点击展开播放列表
  targetingCur() {
    eventEmitter.trigger(Events.SWITCHPLAYLIST)
  }

  render() {
    let { currentTime, duration, transform, percent } = this.state
    let { main } = this.props,
      songInfo = main.songInfo,
      currentLyric = main.currentLyric
    if (!songInfo.hasOwnProperty('al')) {
      songInfo.al = {};
    }
    if (!songInfo.hasOwnProperty('ar')) {
      songInfo.ar = [{}];
    }
    return (
      <View className='page-ui-wrapper'>
        <View className={`play-ui-page ${main.UIPage ? 'play-ui-page-show' : ''}`}>
          <View className='windowsHead'>
            <View className='back iconfont icon-fanhui' onClick={this.goBack.bind(this)}></View>
            <View className='dragbar'></View>
          </View>
          {/* 封面 */}
          <View className='cover'>
            <Image src={songInfo.al.picUrl || coverImg} style={main.playState ? transform : ''}></Image>
          </View>
          {/* 歌词 */}
          <View className='lyric-box'>
            {
              currentLyric.map((item, i) => {
                return (
                  <View key={i} className={`lyric-item ${item.time <= currentTime && item.endtime > currentTime ? 'select' : ''} ${item.time < currentTime + 3 && item.endtime > currentTime - 2 ? 'ready' : ''}`}>
                    <Text>{item.lrc}</Text>
                  </View>
                )
              })
            }
          </View>
          {/* 操作面板 */}
          <View className='player-panel'>
            <View className='song-name' title={songInfo.name || ''}>{songInfo.name || ''}</View>
            <View className='singer'>{songInfo.ar[0].name || ''}</View>
            {/* 歌曲进度条 */}
            <Slider className='progress' value={percent} blockSize='12' onChanging={this.onChangingPercent.bind(this)} onChange={this.onChangePercent.bind(this)} />
            <View className='time'>{this.formatSeconds(currentTime)} / {this.formatSeconds(duration)}</View>
            <View className='control'>
              <View className={`order iconfont ${playOrderIcon[main.playOrder]}`}
                onClick={this.switchOrder.bind(this)}></View>
              <View className='change pre iconfont icon-xiayishou1-copy' onClick={this.playNext.bind(this, -1)}></View>
              <View className={`play iconfont ${main.playState ? 'icon-weibiaoti519' : 'icon-bofang2'}`}
                  onClick={this.switchPlay.bind(this, !main.playState)}></View>
              <View className='change next iconfont icon-xiayishou1' onClick={this.playNext.bind(this, 1)}></View>
              <View className='iconfont icon-liebiao' onClick={this.targetingCur.bind(this)}></View>
            </View>
          </View>
        </View>
      </View>
    )
  }
}

export default PlayDetail
