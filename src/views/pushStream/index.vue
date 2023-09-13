<template>
  <div class="push-stream">
    <div class="push-stream-source">
      <h1 class="step">步骤一：选择推流源</h1>
      <el-card>
        <div class="options">
          <el-row :align="`middle`" :gutter="20">
            <el-col :span="3.5">
              视频设备
            </el-col>
            <el-col :span="4">
              <el-select v-model="videoInputDeviceId" @change="videoInputDeviceIdChange" placeholder="选中视频设备" size="large"
                :loading="loadingEnumerateDevices">
                <el-option v-for="(item, index) in videoInputOptions" :key="index" :label="item.label"
                  :value="item.value" />
              </el-select>
            </el-col>
            <el-col :span="1">
              宽
            </el-col>
            <el-col :span="4">
              <el-input-number v-model="videoInputWidth" controls-position="right" placeholder="视频设备宽" :min="minWidth"
                :max="maxWidth" />
            </el-col>
            <el-col :span="1">
              高
            </el-col>
            <el-col :span="4">
              <el-input-number v-model="videoInputHeight" controls-position="right" placeholder="视频设备高" :min="minHeight"
                :max="maxHeight" />
            </el-col>
            <el-col :span="2">
              帧率
            </el-col>
            <el-col :span="4">
              <el-input v-model="frameRate" type="number" placeholder="视频帧率" />
            </el-col>
          </el-row>
          <el-row :align="`middle`" :gutter="20">
            <el-col :span="3.5">
              音频输入
            </el-col>
            <el-col :span="4">
              <el-select v-model="audioInputDeviceId" width="100%" placeholder="选中音频输入" size="large"
                :loading="loadingEnumerateDevices">
                <el-option v-for="(item, index) in audioInputOptions" :key="index" :label="item.label"
                  :value="item.value" />
              </el-select>
            </el-col>
            <el-col :span="3">
              音频输出
            </el-col>
            <el-col :span="5">
              <el-select v-model="audioOutputDeviceId" placeholder="选中音频输出" size="large"
                :loading="loadingEnumerateDevices">
                <el-option v-for="(item, index) in audioOutputOptions" :key="index" :label="item.label"
                  :value="item.value" />
              </el-select>
            </el-col>
            <el-col :span="6">
              <el-button type="primary" size="large" @click="previewAndGetStream" :disabled="!canStart">预览</el-button>
              <el-button type="info" style="marginLeft:10px;" size="large" @click="reset">重置</el-button>
            </el-col>
          </el-row>
        </div>
        <video poster="@/assets/videoLogo.png" id="player" style="" :controls="previewing" autoplay playsinline></video>
      </el-card>
    </div>
    <div class="push-stream-connect">
      <h1 class="step">步骤二：连接至服务器</h1>
      <el-card>
        <el-row :align="`middle`" style="margin-bottom: 20px;">
          <el-col :span="4">
            推流地址：
          </el-col>
          <el-col :span="20">
            <el-input v-model="pushUrl" placeholder="推流地址" />
          </el-col>
        </el-row>
        <el-row :align="`middle`" style="margin-bottom: 20px;">
          <el-col :span="4">
            推流ID：
          </el-col>
          <el-col :span="20">
            <el-input v-model="pushID" placeholder="推流ID" />
          </el-col>
        </el-row>
        <el-row :align="`middle`" style="margin-bottom: 20px;">
          <el-col :span="4">
            TOKEN：
          </el-col>
          <el-col :span="20">
            <el-input v-model="pushToken" type="textarea" :rows="8" placeholder="推流TOKEN" />
          </el-col>
        </el-row>
        <el-row :align="`middle`" style="margin-bottom: 20px;">
          <el-col :span="4">
            连接状态：
          </el-col>
          <!-- <el-col :span="20"> -->
          <el-col :span="6">
            <el-tag type="success" size="large" class="connect-status" v-if="connectStatus">已连接</el-tag>
            <el-tag type="info" size="large" class="connect-status" v-else>未连接</el-tag>
          </el-col>
          <el-col :span="6">
            <el-tag type="success" size="large" class="connect-status" v-if="joinRoomStatus">已加入房间</el-tag>
          </el-col>
          <el-col :span="6">
            <el-tag type="success" size="large" class="connect-status" v-if="pushStatus">正在推流</el-tag>
          </el-col>
          <!-- </el-col> -->
        </el-row>
        <el-row :align="`middle`" style="margin-bottom: 20px;">
          <el-col :span="4">
            操作：
          </el-col>
          <el-col :span="5">
            <el-button type="primary" class="opt-btn" @click="handleConnect" :disabled="!canlink">1.连接</el-button>
          </el-col>
          <el-col :span="5">
            <el-button type="primary" class="opt-btn" @click="joinRoom" :disabled="!canJoinRoom">2.加入房间</el-button>
          </el-col>
          <el-col :span="5" v-if="pushStatus == 0">
            <el-button type="primary" class="opt-btn" @click="startPush" :disabled="!canPush">3.开始推流</el-button>
          </el-col>
          <el-col :span="5" v-else>
            <el-button type="danger" class="opt-btn" @click="stopPush">停止推流</el-button>
          </el-col>
          <el-col :span="5">
            <el-button type="primary" class="opt-btn" :disabled="pushStatus == 0"
              @click="setMainProducer">设为主摄</el-button>
          </el-col>
        </el-row>
      </el-card>
    </div>

  </div>
  <!-- <div class="output"> {{ JSON.stringify(this.constraints) }}</div> -->

  <el-dialog v-model="settingDialogVisible" title="获取摄像头和麦克风权限失败" width="40%" :show-close="false"
    :close-on-click-modal="false">
    <ul>
      <li>Windows设置:转到设置-> 隐私-> 应用程序权限（左侧）-> 麦克风-> 启用“允许应用程序访问您的麦克风”</li>
      <li>检查是否授权当前网页访问摄像头和麦克风访问权限：授权请打开浏览器的"设置"--"隐私和安全"--"网站设置"--"权限"--"麦克风"/"摄像头",或在浏览器地址栏输入
        chrome://settings/content,设置完成后请刷新当前界面</li>
      <li>检查摄像头/麦克风是否被其他软件占用</li>
    </ul>
    <template #footer>
      <span class="dialog-footer">
        <el-button type="primary" @click="handleSetting">
          去设置
        </el-button>
      </span>
    </template>
  </el-dialog>
</template>
<script>
import { getFetchVideoSocket, socketPromise } from '@/utils/push'
import { Device } from 'mediasoup-client'

export default {
  name: "pushStream",
  async created() {
    this.init()
  },
  computed: {
    canlink() {
      //已连接 || 已加入房间 || 正在推流  时 禁止连接
      return !(this.connectStatus || this.joinRoomStatus || this.pushStatus)
    },
    canJoinRoom() {
      //已连接 && 未加入房间 && 未在推流 才能加入房间
      return (this.connectStatus && !this.joinRoomStatus && !this.pushStatus)
    },
    canPush() {
      //已连接 && 已加入房间 && 未在推流 才能推流
      return (this.connectStatus && this.joinRoomStatus && !this.pushStatus)
    },
    maxWidth() {
      if (this.videoInputDeviceId) {
        return this.selectedVideoInputDevice.capabilitiesWidth.max
      } else {
        return 1920
      }
    },
    minWidth() {
      if (this.videoInputDeviceId) {
        return this.selectedVideoInputDevice.capabilitiesWidth.min
      } else {
        return 1
      }
    },
    minHeight() {
      if (this.videoInputDeviceId) {
        return this.selectedVideoInputDevice.capabilitiesHeight.min
      } else {
        return 1
      }
    },
    maxHeight() {
      if (this.videoInputDeviceId) {
        return this.selectedVideoInputDevice.capabilitiesHeight.max
      } else {
        return 1080
      }
    },
    canStart() {
      return this.videoInputDeviceId || this.audioInputDeviceId
    },
    constraints() {
      let videoConstraints
      let audioConstraints
      if (this.videoInputDeviceId) {
        videoConstraints = {
          width: {
            ideal: this.videoInputWidth,
            min: this.minWidth,
            max: this.maxWidth
          },
          height: {
            ideal: this.videoInputHeight,
            min: this.minHeight,
            max: this.maxHeight
          },
          frameRate: this.frameRate,
          deviceId: { exact: this.videoInputDeviceId },
        }
      } else {
        videoConstraints = false
      }
      if (this.audioInputDeviceId) {
        audioConstraints = { exact: this.audioInputDeviceId }
      } else {
        audioConstraints = false
      }
      return {
        video: videoConstraints,
        audio: audioConstraints
      }
    }
  },
  data() {
    return {
      previewing: false,
      videoInputHeight: 0,
      pushStatsTimer: null,
      videoInputWidth: 0,
      frameRate: 30,
      // pushUrl: "ws://10.49.62.51:9527/",
      pushUrl: "",
      pushToken: "",
      pushID: '925599786798',
      selectedVideoInputDevice: {
        capabilitiesWidth: { max: 0, min: 0 },
        capabilitiesHeight: { max: 0, min: 0 },
      },
      videoInputDeviceId: "",
      audioInputDeviceId: "",
      audioOutputDeviceId: "",
      audioConsumers: [],
      dataConsumers: [],
      recvTransport: null,
      sendTransport: null,
      videoProducerWrapper: null,
      audioProducerWrapper: null,
      videoInputOptions: [],
      audioOutputOptions: [],
      audioInputOptions: [],
      loadingEnumerateDevices: false,
      settingDialogVisible: false,
      device: null,
      newSocket: null,
      roomData: null,
      connectStatus: 0,// 0未连接 1已连接 
      joinRoomStatus: 0,// 0未加入房间 1已加入房间
      pushStatus: 0,// 0未推流 1正在推流
      timestamp: 0,
      bytesSent: 0,
      mediaType: [
        {
          value: 0,
          text: "摄像头"
        }, {
          value: 1,
          text: "窗口"
        }, {
          value: 2,
          text: "麦克风"
        },
      ]
    }
  },
  methods: {
    async init() {
      // 获取摄像头和麦克风权限
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        return;
      } else {
        this.loadingEnumerateDevices = true
        const res = await navigator.mediaDevices.enumerateDevices();
        res.forEach(item => {
          if (item.deviceId !== 'default') {
            // default会重复
            if (item.kind === 'audioinput') {
              this.audioInputOptions.push({
                value: item.deviceId,
                label: item.label
              })
            } else if (item.kind === 'videoinput') {
              let device = null
              const supportedConstraints = navigator.mediaDevices.getSupportedConstraints();
              if ('width' in supportedConstraints && 'height' in supportedConstraints) {
                const capabilities = item.getCapabilities();
                console.log(capabilities, '====>capabilities')
                console.log(`支持的分辨率：`, capabilities.width, capabilities.height);
                device = { capabilitiesWidth: capabilities.width, capabilitiesHeight: capabilities.height }
                console.log("支持指定宽高约束条件");
              } else {
                console.log("不支持指定宽高约束条件");

              }
              console.log('video-device', item.label, item.getCapabilities())
              this.videoInputOptions.push({
                ...device,
                value: item.deviceId,
                label: item.label,
              })
            } else if (item.kind === 'audiooutput') {
              this.audioOutputOptions.push({
                value: item.deviceId,
                label: item.label
              })
            }
          }
        })
        if (this.videoInputOptions.length > 0) {
          this.videoInputDeviceId = this.videoInputOptions[0].value
          this.videoInputDeviceIdChange(this.videoInputDeviceId)
        } else {
          return
        }
        if (this.audioInputOptions.length > 0) {
          this.audioInputDeviceId = this.audioInputOptions[0].value
        }
        if (this.audioOutputOptions.length > 0) {
          this.audioOutputDeviceId = this.audioOutputOptions[0].value
        }
        this.previewAndGetStream()
        this.loadingEnumerateDevices = false
      }
    },
    videoInputDeviceIdChange(val) {
      if (val) {
        this.selectedVideoInputDevice = this.videoInputOptions.find(item => item.value === val)
        this.videoInputWidth = this.selectedVideoInputDevice.capabilitiesWidth.max
        this.videoInputHeight = this.selectedVideoInputDevice.capabilitiesHeight.max

      }
    },
    previewAndGetStream() {
      return new Promise((resolve, reject) => {
        if (!this.videoInputDeviceId) {
          this.$message.error('请至少选择一个视频设备')
          reject('请至少选择一个视频设备')
          return
        }

        this.previewing = false
        console.log(this.constraints, '====>this.constraints')
        navigator.mediaDevices.getUserMedia(this.constraints)
          .then(stream => {
            this.stream = stream
            console.log(this.stream.getVideoTracks()[0].getSettings(), 'this.stream.getVideoTracks()[0]')
            let videoPlay = document.querySelector('video#player');
            videoPlay.srcObject = this.stream;
            this.previewing = true
            resolve(this.stream)
          })// 失败回调 待通用处理
          .catch(this.mediaErrorCaptured);
        // 将音频输出设备应用到媒体流
        // if (this.audioOutputDeviceId) {
        //   const audioTracks = this.stream.getAudioTracks();
        //   audioTracks.forEach(track => {
        //     track.applyConstraints({ deviceId: this.audioOutputDeviceId });
        //   });
        // }

      })
    },
    mediaErrorCaptured(error) {
      console.log("错误信息name打印", error?.name);
      console.log("错误信息message打印", error?.message);
      // 媒体权限失败处理（通用 详细）
      const nameMap = {
        AbortError: "操作中止",
        NotAllowedError: "打开设备权限不足，原因是用户拒绝了媒体访问请求",
        NotFoundError: "找不到满足条件的设备",
        NotReadableError:
          "系统上某个硬件、浏览器或网页层面发生的错误导致设备无法被访问",
        OverConstrainedError: "指定的要求无法被设备满足",
        SecurityError: "安全错误，使用设备媒体被禁止",
        TypeError: "类型错误",
        NotSupportedError: "不支持的操作",
        NetworkError: "网络错误发生",
        TimeoutError: "操作超时",
        UnknownError: "因未知的瞬态的原因使操作失败)",
        ConstraintError: "条件没满足而导致事件失败的异常操作",
      };
      // 媒体权限失败处理（通用 简单）
      const messageMap = {
        "permission denied": "麦克风、摄像头权限未开启，请检查后重试",
        "requested device not found": "未检测到摄像头",
        "could not start video source": "无法访问到摄像头",
      };
      let nameErrorMsg = nameMap[error.name];
      if (!nameErrorMsg) {
        nameErrorMsg = messageMap[error.message.toLowerCase() || "未知错误"];
      }
      // todo
      this.$message.error(nameErrorMsg)
      this.reset()
    },
    handleConnect() {
      this.newSocket = getFetchVideoSocket(this.pushUrl, this.pushToken, this.pushID)
      this.newSocket.request = socketPromise(this.newSocket)
      this.newSocket.on('connect', async (e) => {
        this.$message.success('连接成功!')
        this.connectStatus = 1
      })

      this.newSocket.on('disconnect', (e) => {
        this.$message.error('连接已断开!')
        this.connectStatus = 0
        console.log('newSocket断开连接====>', e)
      })

      this.newSocket.on('connect_error', (e) => {
        this.connectStatus = 0
        this.$message.error('连接出错!')
        console.log('connect_error连接出错====>', e)
      })
    },
    async _loadDevice() {
      try {
        //rtpCapa 帮助服务器和客户端协商并建立有效的媒体传输连接。返回codecs（编解码器）和Header Extensions（RTP 头部扩展）
        //用于定义和协商媒体传输的编解码器和相关信息，以确保在 mediasoup 路由器中建立有效的音视频通信。
        //传入roomId ，serve会返回房间(如没有则创建) 的RouterRtpCapabilities信息
        const rtpCapa = await this.newSocket.request('getRouterRtpCapabilities', {
          roomId: this.pushId//推流ID
        })
        //设备实例，并加载指定的 routerRtpCapabilities，以便在后续的媒体通信过程中正确地协商和使用媒体能力。
        //这有助于确保设备和服务器之间的媒体传输能够顺利进行。
        this.device = new Device()
        await this.device.load({ routerRtpCapabilities: rtpCapa })
        console.log('已连接!! rtpCapa ->', rtpCapa)
      } catch (e) {
        this.$message.error('获取RouterRtpCapabilities信息失败')
        console.error('load device', e)
      }
    },
    async joinRoom() {
      await this._loadDevice()
      const { rtpCapabilities } = this.device;
      let params = {
        "forceTcp": false,
        "rtpCapabilities": rtpCapabilities,
        "roomId": this.pushID,
        "token": this.pushToken,
        "participant": "jasonchen",
        "isFetch": false
      };
      try {
        // 加入房间
        let data = await this.newSocket.request('join_room/v2', params)
        if (data.error) {
          this.$message.error(data.error)
          this.$message.error('加入房间房间失败')
          console.error('join_room/v2 error -> ', data.error)
          this.joinRoomStatus = 0
          return
        }
        console.log('加入房间房间成功：', data)
        this.$message.success('加入房间房间成功')
        this.roomData = data
        this.joinRoomStatus = 1

        // 创建SendTransport
        this.sendTransport = this.device.createSendTransport(this.roomData)
        this.sendTransport.on('connect', ({ dtlsParameters }, callback, errback) => {
          this.newSocket.request('connect_room', {
            roomId: this.pushID,
            dtlsParameters
          }).then(callback).catch(errback);
        });

        this.sendTransport.on('produce', async ({ kind, rtpParameters }, callback, errback) => {
          try {
            const { id } = await this.newSocket.request('produce', {
              kind,
              rtpParameters,
              roomId: this.pushID,
            });
            callback({ id });
          } catch (err) {
            errback(err);
          }
        });
      } catch (err) {
        console.log(err, '==========>err')
      }
    },
    startPush() {
      // 更新stream
      this.previewAndGetStream().then(() => {
        try {
          // 推视频
          let encodingParameters = {
            maxBitrate: 400 * 1024 * 8,
            minBitrate: 400 * 1024 * 8,
            maxFramerate: this.frameRate,
            active: true,
            adaptivePtime: false,
            // scalabilityMode: "S1T1"
          }
          let params = {
            track: this.stream.getVideoTracks()[0],
            stream: this.stream,
            source: this.videoInputOptions.find(item => item.value === this.videoInputDeviceId).label,
            encodings: [encodingParameters]
          }
          this.sendTransport.produce(params).then((producer) => {
            this.pushStatus = 1
            this.videoProducerWrapper = { producer }
            this.$message.success('推流成功')
            console.log('producer create successfully. ', producer)
            this.handlePushStats()
          })
        } catch (err) {
          this.$message.error('推流失败')
          console.log('producer create fail. ', err)
        }
        // 推音频
      })
    },
    async handlePushStats() {
      const videoProducer = this.videoProducerWrapper.producer
      if (videoProducer?.id) {
        let producerStats = await this.newSocket.request('get_producer_stats', {
          roomId: this.pushID,
          participant: 'jasonchen',
          producerId: videoProducer.id,
        })
        if (typeof producerStats.values === 'function') {
          producerStats = Array.from(producerStats.values());
        }
        const inboundRTtp = producerStats.find(item => item.type === 'inbound-rtp')
        if (inboundRTtp) {
          // console.log((inboundRTtp), '=========>inboundRTtp')
          // console.log('远程读取的比特率：', 
          // inboundRTtp.bitrate/ (1024)
          // , 'Kb/S=========>inboundRTtp')
          console.log('远程读取的比特率：',
            (inboundRTtp.bitrate / (1024 * 1024)).toFixed(1)
            , 'Mb/S=========>inboundRTtp')
        }


        let realProducerStats = await videoProducer.getStats()
        if (typeof realProducerStats.values === 'function') {
          realProducerStats = Array.from(realProducerStats.values());
        }
        const localOutboundRtp = realProducerStats.find(item => item.type === 'outbound-rtp')
        // console.log(`localOutboundRtp=====>`,localOutboundRtp)
        const timestamp = localOutboundRtp.timestamp

        const deltaTimestamp = (timestamp - this.timestamp) / 1000
        let bytesSentTemp = localOutboundRtp.bytesSent - this.bytesSent
        let localBitrate = (bytesSentTemp * 8) / deltaTimestamp
        this.bytesSent = localOutboundRtp.bytesSent
        this.timestamp = timestamp

        // console.log('本地读取的比特率：', localBitrate/(1024), 'Kb/s=========>outbound-rtp')
        console.log('本地读取的比特率：', (localBitrate / (1024 * 1024)).toFixed(1), 'Mb/s=========>outbound-rtp')


        const localCandidatePair = realProducerStats.find(item => item.type === 'candidate-pair')

        if (localCandidatePair) {

          const { currentRoundTripTime } = localCandidatePair
          let currentRoundTripTimeMs = currentRoundTripTime * 1000
          console.log(`推流延时RTT：${currentRoundTripTimeMs}ms`)
        }
        this.pushStatsTimer = setTimeout(this.handlePushStats, 2000)

      } else {
        clearTimeout(this.pushStatsTimer)
        this.pushStatsTimer = null
        this.bytesSent = 0
        this.timestamp = 0
        return
      }
    },
    async stopPush() {
      const videoProducer = this.videoProducerWrapper.producer
      if (videoProducer != null) {
        await this.newSocket.request("produce_stop", {
          "producerId": videoProducer.id,
          "roomId": this.pushID,
        });
        videoProducer?.close();
        this.videoProducerWrapper = null;
        this.pushStatus = 0;
        this.roomData = null;
        console.log("停止视频推流.");
      }
      // const audioProducer = this.audioProducerWrapper
      // if (audioProducer != null) {
      //   await this.newSocket.request("produce_stop", {
      //     "producerId": audioProducer.id,
      //     "roomId": this.pushID,
      //   });
      //   audioProducer?.close();
      //   this.audioProducerWrapper = null;
      //   console.log("停止音频推流.");
      // }
    },

    // 设置主摄像头
    async setMainProducer() {
      const videoProducer = this.videoProducerWrapper.producer
      if (videoProducer != null && this.newSocket) {
        let data = await this.newSocket.request('set_main_producer', {
          roomId: this.pushID,
          mainProducerId: videoProducer.id,
        })
        if (data.error) {
          this.$message.error(data.error)
          console.error('join_room/v2 error -> ', data.error)
        } else {
          this.$message.success('设置成功')
        }
      }
    },
    reset() {
      this.previewing = false
      this.videoInputHeight = 0
      this.videoInputWidth = 0
      this.frameRate = 30
      this.videoInputDeviceId = ""
      this.audioInputDeviceId = ""
      this.audioOutputDeviceId = ""
      this.connectStatus = 0
      this.joinRoomStatus = 0
      this.pushStatus = 0
      this.videoProducerWrapper = null;
      this.audioProducerWrapper = null,
      this.roomData = null;
      this.settingDialogVisible = true
      let videoPlay = document.querySelector('video#player');
      videoPlay.srcObject = null;
    },
    handleSetting() {
      this.settingDialogVisible = false
      // window.open('chrome://settings/content')
    },
  },
}
</script>
<style scoped lang="scss">
.push-stream {
  font-size: 20px;
  padding: 2rem;
  display: flex;
  justify-content: space-around;
  align-content: center;
  flex-wrap: wrap;
  width: 100%;


  .push-stream-source {
    width: 50%;
    min-width: 800px;

    .options {

      .el-row {
        margin-bottom: 20px;
      }
    }

    .preview {
      .el-card__body {
        margin: 0 auto;
      }
    }

    video {
      // border: 1px solid gray;
      min-height: 700px;
      width: 100%
    }

    .output {
      display: inline-block;
      font-family: 'Inconsolata', 'Courier New', monospace;
      font-size: 0.9em;
      padding: 10px 10px 10px 25px;
      position: relative;
      width: 100%;
      white-space: break-spaces;
      word-wrap: break-word;
    }
  }

  .push-stream-connect {
    min-width: 800px;
    width: 48%;

    .connect-status,
    .opt-btn {
      width: 160px;
      height: 40px;
      font-size: 20px;
    }
  }

  .step {
    margin-bottom: 20px;
    margin-top: 20px;
    font-weight: 700;
    color: #303133;
  }


}
</style>
