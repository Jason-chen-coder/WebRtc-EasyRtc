<template>
    <div class="pull-stream">
        <div class="step">
            <h1 class="title">步骤一：连接至服务器</h1>
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
                    <el-col :span="4">
                        <el-tag type="success" size="large" class="connect-status" v-if="connectStatus">已连接</el-tag>
                        <el-tag type="info" size="large" class="connect-status" v-else>未连接</el-tag>
                    </el-col>
                    <el-col :span="4">
                        <el-tag type="success" size="large" class="connect-status" v-if="joinRoomStatus">已加入房间</el-tag>
                    </el-col>
                </el-row>
                <el-row :align="`middle`" style="margin-bottom: 20px;">
                    <el-col :span="4">
                        操作：
                    </el-col>
                    <el-col :span="3">
                        <el-button type="primary" class="opt-btn" @click="handleConnect"
                            :disabled="!canlink">1.连接</el-button>
                    </el-col>
                    <el-col :span="5">
                        <el-button type="primary" class="opt-btn" @click="joinRoom"
                            :disabled="!canJoinRoom">2.加入房间并拉流</el-button>
                    </el-col>
                    <el-col :span="4">
                        <el-button type="primary" class="opt-btn" @click="reload">重新加载</el-button>
                    </el-col>
                </el-row>
            </el-card>
        </div>
        <div class="step">
            <h1 class="title">步骤二：拉流画面</h1>
            <el-card>
                <div class="live-container">
                    <video poster="@/assets/videoLogo.png" id="player" controls autoplay playsinline></video>
                    <div class="fetch-video-list">
                        <div class="list-title">推流视频列表</div>
                        <div class="list-container" v-if="consumerWrappers.length > 0">
                            <div class="video-item" v-for="(item) in consumerWrappers" :key="item.id"
                                @click="playFetchVideo(item.producerId)">
                                <video poster="@/assets/videoLogo.png" :id="`video-item-${item.id}`" autoplay
                                    playsinline></video>
                            </div>
                        </div>
                        <el-empty description="暂无推流视频" v-else></el-empty>
                    </div>
                </div>
            </el-card>
        </div>

    </div>
</template>
<script>
import { socketPromise, getFetchVideoSocket } from '@/utils/push'
import { Device } from 'mediasoup-client';

export default {
    name: 'pullStream',
    data() {
        return {
            // pushUrl: "ws://10.49.62.51:9527/",
            pushUrl: "",
            pushToken: "",
            newSocket: null,
            pushID: '925599786798',
            consumerWrappers: [],
            mainProducerId: '',
            connectStatus: 0,// 0未连接 1已连接 
            joinRoomStatus: 0,// 0未加入房间 1已加入房间 
            device: null,
            transport: null,
            statsTimer: null
        }
    },
    beforeUnmount() {
        clearTimeout(this.statsTimer)
        this.statsTimer = null
    },
    computed: {
        canlink() {
            //已连接 || 已加入房间  时 禁止连接
            return !(this.connectStatus || this.joinRoomStatus)
        },
        canJoinRoom() {
            //已连接 && 未加入房间  才能加入房间
            return (this.connectStatus && !this.joinRoomStatus)
        },
    },
    watch: {
        consumerWrappers: {
            handler() {
                setTimeout(() => {
                    this.consumerWrappers.map(item => {
                        let videoPlay = document.querySelector(`video#video-item-${item.id}`);
                        videoPlay.srcObject = item.stream
                    })
                }, 300)
            },
            deep: true,
            immediate: true
        }
    },
    methods: {
        reload() {
            window.location.reload()
        },
        async _loadDevice(routerRtpCapabilities) {
            try {
                const device = new Device();

                await device.load({ routerRtpCapabilities });
                this.device = device
                console.log('FetchVideo', 'load device success');
            } catch (error) {
                if (error.name === 'UnsupportedError') {
                    console.error('browser not supported');
                }
            }
        },
        async _subscribe() {
            const data = await this.newSocket.request('join_room/v2', {
                forceTcp: false,
                roomId: this.pushID,
                participant: 'jasonchen',
                isFetch: true,
                token: this.pushToken
            });

            console.log('FetchVideo', `join room success, my name: jasonchen`);

            if (data.error) {
                console.error(data.error);
                this.$message.error(data.error)
                return;
            }

            this.joinRoomStatus = 1

            this.transport = this.device.createRecvTransport(data);

            this.transport.on('connect', ({ dtlsParameters }, callback, errback) => {
                this.newSocket.request('connect_room', {
                    roomId: this.pushID,
                    participant: 'jasonchen',
                    dtlsParameters
                })
                    .then(callback)
                    .catch(errback);
            });

            this.transport.on('connectionstatechange', async state => {
                switch (state) {
                    case 'connecting':
                        break;

                    case 'connected':
                        console.log('FetchVideo', 'connected');

                        // await this._createConsumers();
                        break;

                    case 'failed':
                        this.transport.close();
                        break;

                    default:
                        break;
                }
            });
            await this._createConsumers();
        },
        handleConnect() {
            console.log('====推拉流初始化====');
            this.newSocket = getFetchVideoSocket(this.pushUrl, this.pushToken, this.pushID)
            this.newSocket.request = socketPromise(this.newSocket)
            this.newSocket.on('connect', async () => {
                this.$message.success('连接成功!')
                this.connectStatus = 1
            });

            this.newSocket.on('disconnect', () => {
                this.$message.error('连接已断开!')
                console.log('FetchVideo', '连接断开');
            });

            this.newSocket.on('connect_error', err => {
                this.$message.error('连接错误!')
                console.log('FetchVideo', '连接错误', err);
            });

            this.newSocket.on('on_consumer_close', async ({ consumerId }) => {
                console.log('FetchVideo', 'on_consumer_close', consumerId);

                const consumerWrapper = this.consumerWrappers.find(item => item.id === consumerId);

                if (consumerWrapper) {
                    if (consumerWrapper.consumer) {
                        consumerWrapper.consumer.close();
                    }
                    const consumerWrappers = this.consumerWrappers.filter(item => item.id !== consumerId);

                    this.consumerWrappers = consumerWrappers
                }
                this.playFetchVideo()
            });

            this.newSocket.on('on_produce', async ({ roomId, id, kind }) => {
                console.log('FetchVideo', 'on_produce', roomId, id, kind);

     
                if (roomId === this.pushID && kind === 'video') {
                    const idx = this.consumerWrappers.findIndex(item => item.producerId === id);

                    if (idx < 0) {
                        const consumerWrapper = await this._createConsumer(id);
                        this.consumerWrappers = [...this.consumerWrappers, consumerWrapper]
                        if (this.consumerWrappers.length == 1) this.playFetchVideo()
                    }
                }
            });

            this.newSocket.on('produce_main_change', async ({ roomId, mainProducerId }) => {
                console.log('produce_main_change', roomId, mainProducerId);

                // if (roomId === this.pushID) {
                // const consumerWrapper = await this._createConsumer(mainProducerId);
                // this.consumerWrappers = [...this.consumerWrappers, consumerWrapper]
                mainProducerId && this.playFetchVideo(mainProducerId)
                // }
            });
        },
        async joinRoom() {
            const routerRtpCapabilities = await this.newSocket.request('getRouterRtpCapabilities', { roomId: this.pushID });
            await this._loadDevice(routerRtpCapabilities);
            await this._subscribe();
        },

        playFetchVideo(producerId) {
            if (this.mainProducerId == producerId) return
            let stream = null
            if (this.consumerWrappers.length > 0) {
                if (producerId) {
                    this.mainProducerId = producerId
                } else {
                    this.mainProducerId = this.consumerWrappers[0].producerId
                }
                let consumerWrapper = this.consumerWrappers.find(item => item.producerId == this.mainProducerId)


                stream = consumerWrapper.stream;
                console.log('拉流媒体信息：', stream.getVideoTracks()[0].getSettings())
                this.handleConsumerStats()
            }
            let videoPlay = document.querySelector('video#player');
            videoPlay.srcObject = stream
            this.$message.info('主摄改变')
        },
        async handleConsumerStats() {
            try {
                let consumerWrapper = this.consumerWrappers.find(item => item.producerId == this.mainProducerId)
                if (consumerWrapper) {
                    let stats = await consumerWrapper.consumer.getStats()
                    if (typeof stats.values === 'function') {
                        stats = Array.from(stats.values());
                    }
                    // candidate-pair：表示一个ICE候选对，包括本地候选和远程候选。
                    // certificate：表示与媒体流相关的证书信息。
                    // codec：表示使用的编解码器类型。
                    // csrc：表示贡献媒体流（Contributing Source, CSRC）的列表。
                    // data-channel：表示与数据通道相关的统计信息。
                    // inbound-rtp：表示接收到的实时传输协议（RTP）数据的信息。
                    // local-candidate：表示本地候选的信息，用于建立媒体连接。
                    // outbound-rtp：表示发送的实时传输协议（RTP）数据的信息。
                    // peer-connection：表示与对等连接相关的统计信息。
                    // receiver：表示接收器的统计信息。
                    // remote-candidate：表示远程候选的信息，用于建立媒体连接。
                    // remote-inbound-rtp：表示与远程接收到的媒体流相关的统计信息。
                    // remote-outbound-rtp：表示与远程发送的媒体流相关的统计信息。
                    // sender：表示发送器的统计信息。
                    // stream：表示与媒体流相关的统计信息。
                    // track：表示与单个媒体轨道相关的统计信息。
                    // transport：表示与媒体传输相关的统计信息，如网络连接和传输协议。
                    const outboundRTtp = stats.find(item => item.type === 'outbound-rtp')
                    const inboundRtp = stats.find(item => item.type === 'inbound-rtp')
                    console.log('outboundRTtp=====>', outboundRTtp)
                    console.log('inboundRtp=====>', inboundRtp)

                    const pair = stats.find(item => item.type === 'candidate-pair')
                    const timestamp = stats[0].timestamp

                    if (pair) {
                        const { bytesReceived, currentRoundTripTime } = pair
                        const deltaBytesReceived = bytesReceived - this.bytesReceived
                        const deltaTimestamp = timestamp - this.timestamp
                        const bitrate = deltaBytesReceived / deltaTimestamp * 1000 / 1000
                        this.bytesReceived = bytesReceived
                        let currentRoundTripTimeMs = currentRoundTripTime * 1000
                        console.log(`比特率：${bitrate.toFixed(2)}KB/s`)
                        console.log(`拉流延时RTT：${currentRoundTripTimeMs}ms`)
                        this.timestamp = timestamp
                    }
                } else {
                    clearTimeout(this.statsTimer)
                }
            } catch (err) {
                console.log('err===>', err)
            }
            this.statsTimer = setTimeout(this.handleConsumerStats, 2000)
        },
        async _createConsumers() {
            console.log('FetchVideo', 'create consumers start...');

            const allProducers = await this.newSocket.request('get_all_video_producer', { roomId: this.pushID });
            console.log('FetchVideo', 'all producers -> ', allProducers);
            const consumerWrappers = [];

            for (const producerId of allProducers) {
                consumerWrappers.push(await this._createConsumer(producerId));
            }
            this.consumerWrappers = consumerWrappers
            if (!this.mainProducerId) {
                this.playFetchVideo()
            }
        },
        async _createConsumer(producerId) {

            const { rtpCapabilities } = this.device;
            const data = await this.newSocket.request('consume', { rtpCapabilities, producerId, roomId: this.pushID, participant: 'jasonchen'.name });
            const {
                id,
                kind,
                rtpParameters
            } = data;

            const codecOptions = {};
            const consumer = await this.transport.consume({
                id,
                producerId,
                kind,
                rtpParameters,
                codecOptions
            });
            const stream = new MediaStream();

            stream.addTrack(consumer.track);

            return { stream, id, producerId, consumer };
        }
    }
}
</script>
<style  lang="scss">
.pull-stream {
    min-height: 100vh;
    display: flex;
    align-items: center;
    flex-direction: column;
    justify-content: flex-start;
    padding: 10px;

    .step {
        width: 90%;

        .title {
            width: 100%;
            margin-bottom: 20px;
            margin-top: 20px;
            font-weight: 700;
            color: #303133;
        }

    }

    .live-container {
        display: flex;
        justify-content: flex-start;
        align-content: center;
        height: 600px;
        border: 1px solid gray;

        #player {
            flex: 1;
            overflow: hidden;
            height: 100%;
        }

        .fetch-video-list {
            width: 25%;
            height: 100%;
            overflow: hidden;
            display: flex;
            flex-direction: column;
            justify-content: flex-start;
            border-left: 1px solid gray;
            min-width: 290px;

            .el-empty {
                margin: auto;
            }

            .list-title {
                text-align: center;
                height: 40px;
                line-height: 40px;
                background: #ffffff;
                border-bottom: 0.5px solid gray;
            }

            .list-container {
                padding: 10px 0;
                flex: 1;
                overflow: auto;
                display: flex;
                flex-direction: column;
                align-items: center;

                .video-item {
                    justify-content: center;
                    display: flex;
                    align-items: center;
                    padding: 10px;
                    cursor: pointer;

                    video {
                        transition: all 0.3s linear;
                        margin-bottom: 10px;
                        width: 260px;
                        height: 170px;
                        border: 0.5px solid #efefef;
                        padding: 5px;
                    }

                    &:hover {
                        video {
                            box-shadow: 0px 12px 32px 4px rgba(0, 0, 0, 0.04), 0px 8px 20px rgba(0, 0, 0, 0.08);
                        }
                    }
                }



            }
        }
    }

}
</style>
  