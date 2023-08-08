<template>
  <div class="push-stream">
    <div class="options">
      <el-row :align="`middle`" :gutter="20">
        <el-col :span="2">
          视频源
        </el-col>
        <el-col :span="6">
          <el-select v-model="videoInputDeviceId" placeholder="选中视频源" size="large" :loading="loadingEnumerateDevices">
            <el-option v-for="(item, index) in videoInputOptions" :key="index" :label="item.label" :value="item.value" />
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
        <el-col :span="2">
          音频输入
        </el-col>
        <el-col :span="6">
          <el-select v-model="audioInputDeviceId" width="100%" placeholder="选中音频输入" size="large"
            :loading="loadingEnumerateDevices">
            <el-option v-for="(item, index) in audioInputOptions" :key="index" :label="item.label" :value="item.value" />
          </el-select>
        </el-col>
        <el-col :span="2">
          音频输出
        </el-col>
        <el-col :span="5">
          <el-select v-model="audioOutputDeviceId" placeholder="选中音频输出" size="large" :loading="loadingEnumerateDevices">
            <el-option v-for="(item, index) in audioOutputOptions" :key="index" :label="item.label" :value="item.value" />
          </el-select>
        </el-col>
        <el-col :span="6">
          <el-button type="primary" size="large" @click="start" :disabled="!canStart">预览</el-button>
          <el-button type="info" style="marginLeft:10px;" size="large" @click="reset">重置</el-button>
        </el-col>
      </el-row>
    </div>
    <video poster="../../assets/videoLogo.png" id="player" style="height: 700px;" :controls="previewing" autoplay
      playsinline></video>
    <el-row :align="`middle`" class="preview">
      <el-col :span="24">
        <el-card>
          <div class="output"> {{ JSON.stringify(this.constraints) }}</div>
        </el-card>
      </el-col>
    </el-row>

  </div>

  <el-dialog v-model="settingDialogVisible" title="获取摄像头和麦克风权限失败" width="40%" :show-close="false"
    :close-on-click-modal="false">
    <span>请打开浏览器的"设置"--"隐私和安全"--"网站设置"--"权限"--"麦克风"/"摄像头",或在浏览器地址栏输入 chrome://settings/content,设置完成后请刷新当前界面</span>
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

export default {
  name: "pushStream",
  async created() {
    this.init()
  },
  computed: {
    minWidth() {
      if (this.videoInputDeviceId) {
        return this.videoInputOptions.find(item => item.value === this.videoInputDeviceId).capabilitiesWidth.min || 1920
      } else {
        return 1920
      }
    },
    maxWidth() {
      if (this.videoInputDeviceId) {
        return this.videoInputOptions.find(item => item.value === this.videoInputDeviceId).capabilitiesWidth.max || 1
      } else {
        return 1
      }
    },
    miHeight() {
      if (this.videoInputDeviceId) {
        return this.videoInputOptions.find(item => item.value === this.videoInputDeviceId).capabilitiesHeight.max || 1920
      } else {
        return 1920
      }
    },
    maxHeight() {
      if (this.videoInputDeviceId) {
        return this.videoInputOptions.find(item => item.value === this.videoInputDeviceId).capabilitiesHeight.min || 1
      } else {
        return 1
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
          width: this.videoInputWidth,
          height: this.videoInputHeight,
          frameRate: this.frameRate,
          deviceId: { exact: this.videoInputDeviceId },
          mandatory: {
            minWidth: this.minWidth,
            minHeight: this.minHeight,
            minFrameRate: this.frameRate,
          },
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
      videoInputDeviceId: "",
      audioInputDeviceId: "",
      audioOutputDeviceId: "",
      videoInputOptions: [],
      audioOutputOptions: [],
      audioInputOptions: [],
      loadingEnumerateDevices: false,
      settingDialogVisible: false,
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
        this.settingDialogVisible = true
      })
    },
    async start() {
      let videoPlay = document.querySelector('video#player');

      try {
        videoPlay.srcObject = null;
        this.previewing = false
        const stream = await navigator.mediaDevices.getUserMedia(this.constraints);
        // 将音频输出设备应用到媒体流
        if (this.audioOutputDeviceId) {
          const audioTracks = stream.getAudioTracks();
          audioTracks.forEach(track => {
            track.applyConstraints({ deviceId: this.audioOutputDeviceId });
          });
        }
        videoPlay.srcObject = stream;
        this.previewing = true
      } catch (error) {
        console.error("获取媒体流失败：", error);
        this.previewing = false
        this.$message.error('获取媒体流失败')
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
  padding: 2rem;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-content: center;

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
    border: 1px solid gray;
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
</style>
