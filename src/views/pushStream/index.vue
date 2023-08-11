<template>
  <div class="push-stream">
    <div class="push-stream-source">
      <h1 class="step">步骤一：选择推流源</h1>
      <el-card>
        <div class="options">
          <el-row :align="`middle`" :gutter="20">
            <el-col :span="2">
              视频源
            </el-col>
            <el-col :span="6">
              <el-select v-model="videoInputDeviceId" placeholder="选中视频源" size="large" :loading="loadingEnumerateDevices">
                <el-option v-for="(item, index) in videoInputOptions" :key="index" :label="item.label"
                  :value="item.value" />
              </el-select>
            </el-col>
            <el-col :span="1">
              宽
            </el-col>
            <el-col :span="4">
              <el-input v-model="videoInputWidth" type="number" placeholder="视频源宽" :min="minWidth" :max="maxWidth" />
            </el-col>
            <el-col :span="1">
              高
            </el-col>
            <el-col :span="4">
              <el-input v-model="videoInputHeight" type="number" placeholder="视频源高" />
            </el-col>
            <el-col :span="2">
              帧率
            </el-col>
            <el-col :span="4">
              <el-input v-model="frameRate" type="number" placeholder="视频帧率" />
            </el-col>
          </el-row>
          <el-row :align="`middle`" :gutter="20">
            <el-col :span="3">
              音频输入
            </el-col>
            <el-col :span="6">
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
            <el-col :span="4">
              <el-button type="primary" size="large" @click="preview" :disabled="!canStart">预览</el-button>
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
          <el-col :span="20">
            <el-tag type="success" size="large" class="connect-status" v-if="connectStatus">已连接</el-tag>
            <el-tag type="info" size="large" class="connect-status" v-else>未连接</el-tag>
          </el-col>
        </el-row>
        <el-row :align="`middle`" style="margin-bottom: 20px;">
          <el-col :span="4">
            操作：
          </el-col>
          <el-col :span="8">
            <el-button type="primary" class="opt-btn" @click="handleConnect" :disabled="connectStatus">连接</el-button>
          </el-col>
          <el-col :span="8">
            <el-button type="primary" class="opt-btn" @click="startPush" :disabled="connectStatus !== 1">{{ pushStatus ==
              0 ? "开始推流" : "停止推流" }}</el-button>
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
    maxWidth() {
      if (this.videoInputDeviceId) {
        return this.videoInputOptions.find(item => item.value === this.videoInputDeviceId).capabilitiesWidth.max || 1920
      } else {
        return 1920
      }
    },
    minWidth() {
      if (this.videoInputDeviceId) {
        return this.videoInputOptions.find(item => item.value === this.videoInputDeviceId).capabilitiesWidth.min || 1
      } else {
        return 1
      }
    },
    minHeight() {
      if (this.videoInputDeviceId) {
        return this.videoInputOptions.find(item => item.value === this.videoInputDeviceId).capabilitiesHeight.min || 1
      } else {
        return 1
      }
    },
    maxHeight() {
      if (this.videoInputDeviceId) {
        return this.videoInputOptions.find(item => item.value === this.videoInputDeviceId).capabilitiesHeight.max || 1920
      } else {
        return 1920
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
      videoInputHeight: 1080,
      videoInputWidth: 1920,
      frameRate: 30,
      pushUrl: "ws://172.18.4.47:9527/",
      pushToken: "eyJ0eXBlIjoiand0IiwiYWxnIjoiUlMyNTYifQ.eyJleHBpcmUiOjMxMTA0MTIwMDAwMDAsInVzZXJJZCI6ImM4MGRjNDdmN2NjMTQ3NzM4MDI5ZjczMDBiMzFjNmYzIiwicm9vbUlkIjoiNTA2OTM5MTEwOTkxIiwidXNlcm5hbWUiOiLmtYvor5Xorr7lpIcxIiwiZXhwIjo0NzkxMTgyNzQ5LCJpYXQiOjE2ODA3NzA3NDksImlzcyI6Im1naV9hdXRoIn0.nykP8LfATIFMeXX9bXfY7zYSnkEpN3TQfohvXQZMbAWAfhMkRwrvxdc5jm8h4FPPEhjPv6h2l9q4oZnsa6Gd_F5NNIN94bzmxyCyAdFQjnfTx8dz69l5eioIKQXHxjwVsg16hsJszYsiuxGWH78JfsN25CrzgiO54GQPHx1II5Zv4UGlklofRoPLdYEygH0P_SnvqtBw5nCCbqN8D0plEDyH7Wi088iVGI3efcApiFDQuhhlSddgFKn6CkySkAcTCZb0bwXVSexlS2lH5OS6SAJYqAHJ3DAQUzfVWG3yt65ORzfzeazvFSy29lDgwQvfUg1B4tMOI4YHwhSrqNNWUw",
      pushID: '506939110991',
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
      connectStatus: 0,// 0未连接 1已连接 
      pushStatus: 0,// 0未推流 1正在推流
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
    init() {
      // 获取摄像头和麦克风权限
      navigator.mediaDevices.getUserMedia({ audio: true, video: true }).then(async () => {
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
                  console.log(`支持的分辨率：`, capabilities.width, capabilities.height);
                  device = { capabilitiesWidth: capabilities.width, capabilitiesHeight: capabilities.height }
                  console.log("支持指定宽高约束条件");
                } else {
                  console.log("不支持指定宽高约束条件");

                }
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
          this.loadingEnumerateDevices = false
        }
      }).catch(err => {
        console.log(err, '============>获取推流设备失败')
        this.settingDialogVisible = true
      })
    },
    async preview() {
      let videoPlay = document.querySelector('video#player');
      try {
        videoPlay.srcObject = null;
        this.previewing = false
        console.log(this.constraints)
        this.stream = await navigator.mediaDevices.getUserMedia(this.constraints);
        // 将音频输出设备应用到媒体流
        if (this.audioOutputDeviceId) {
          const audioTracks = this.stream.getAudioTracks();
          audioTracks.forEach(track => {
            track.applyConstraints({ deviceId: this.audioOutputDeviceId });
          });
        }
        videoPlay.srcObject = this.stream;
        this.previewing = true
      } catch (error) {
        console.error("获取媒体流失败：", error);
        this.previewing = false
        this.$message.error('获取媒体流失败')
      }
    },
    handleConnect() {
      this.newSocket = getFetchVideoSocket(this.pushUrl, this.pushToken)
      this.newSocket.request = socketPromise(this.newSocket)
      this.newSocket.on('connect', async (e) => {
        await this._loadDevice()
        this.joinRoom()
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
        console.error('load device', e)
      }
    },
    startPush() {
      if (this.pushStatus == 1) {
        this.$message.error('已经正在推流')
      } else {
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
          console.log('producer create successfully. ', producer.kind, producer.id)
        })
      }
    },
    async joinRoom() {
      const { rtpCapabilities } = this.device;
      let params = {
        "forceTcp": false,
        "rtpCapabilities": rtpCapabilities,
        "roomId": this.pushID,
        "token": this.pushToken,
        "participant": "",
      };
      try {
        // 加入房间
        let data = await this.newSocket.request('join_room', params)
        console.log('加入房间房间成功：',data)
        if (data.error) {
          console.error('join_room error -> ', data.error)
          return
        }
        // 创建SendTransport
        this.sendTransport = this.device.createSendTransport(data)
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
    reset() {
      this.previewing = false
      this.videoInputHeight = 1080
      this.videoInputWidth = 1920
      this.frameRate = 30
      this.videoInputDeviceId = ""
      this.audioInputDeviceId = ""
      this.audioOutputDeviceId = ""
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
