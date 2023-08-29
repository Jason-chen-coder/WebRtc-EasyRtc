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
            pushUrl: "ws://172.18.4.47:9527/",
            pushToken: "eyJ0eXBlIjoiand0IiwiYWxnIjoiUlMyNTYifQ.eyJleHBpcmUiOjMxMTA0MTIwMDAwMDAsInVzZXJJZCI6ImM4MGRjNDdmN2NjMTQ3NzM4MDI5ZjczMDBiMzFjNmYzIiwicm9vbUlkIjoiNTA2OTM5MTEwOTkxIiwidXNlcm5hbWUiOiLmtYvor5Xorr7lpIcxIiwiZXhwIjo0NzkxMTgyNzQ5LCJpYXQiOjE2ODA3NzA3NDksImlzcyI6Im1naV9hdXRoIn0.nykP8LfATIFMeXX9bXfY7zYSnkEpN3TQfohvXQZMbAWAfhMkRwrvxdc5jm8h4FPPEhjPv6h2l9q4oZnsa6Gd_F5NNIN94bzmxyCyAdFQjnfTx8dz69l5eioIKQXHxjwVsg16hsJszYsiuxGWH78JfsN25CrzgiO54GQPHx1II5Zv4UGlklofRoPLdYEygH0P_SnvqtBw5nCCbqN8D0plEDyH7Wi088iVGI3efcApiFDQuhhlSddgFKn6CkySkAcTCZb0bwXVSexlS2lH5OS6SAJYqAHJ3DAQUzfVWG3yt65ORzfzeazvFSy29lDgwQvfUg1B4tMOI4YHwhSrqNNWUw",
            newSocket: null,
            pushID: '506939110991',
            consumerWrappers: [],
            mainProducerId: '',
            connectStatus: 0,// 0未连接 1已连接 
            joinRoomStatus: 0,// 0未加入房间 1已加入房间 
            device: null,
            transport: null
        }
    },
    mounted() {
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

            const data = await this.newSocket.request('join_room', {
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
                        const consumer = await this._createConsumer(id);
                        this.consumerWrappers = [...this.consumerWrappers, consumer]
                        if (this.consumerWrappers.length == 1) this.playFetchVideo()
                    }
                }
            });

            this.newSocket.on('produce_main_change', async ({ roomId, mainProducerId }) => {
                console.log('produce_main_change', roomId, mainProducerId);

                // if (roomId === this.pushID) {
                // const consumer = await this._createConsumer(mainProducerId);
                // this.consumerWrappers = [...this.consumerWrappers, consumer]
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
            if(this.mainProducerId == producerId)return 
            let stream = null
            if (this.consumerWrappers.length > 0) {
                if (producerId) {
                    this.mainProducerId = producerId
                } else {
                    this.mainProducerId = this.consumerWrappers[0].producerId
                }
                let consumer = this.consumerWrappers.find(item => item.producerId == this.mainProducerId)
                console.log(consumer, '========>')
                stream = consumer.stream;
                console.log('拉流媒体信息：', stream.getVideoTracks()[0].getSettings())
            }
            let videoPlay = document.querySelector('video#player');
            videoPlay.srcObject = stream
            this.$message.info('主摄改变')
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
  