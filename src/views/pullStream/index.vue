<template>
    <div class="pullStream">
        <h1>这里是拉流</h1>
        <video poster="@/assets/videoLogo.png" id="player" controls autoplay playsinline></video>
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
            pushToken: "eyJ0eXBlIjoiand0IiwiYWxnIjoiUlMyNTYifQ.eyJwaG9uZSI6IjE3NjIwNDcxMDI5IiwiZXhwaXJlIjoyNTkyMDAwMDAwLCJ1c2VyTmFtZSI6IjE3NjIwNDcxMDI5IiwidXNlcklkIjoxNDYwODc4Mzk4ODU0MjY2ODgwLCJleHAiOjE2OTQyNTIwODEsImlhdCI6MTY5MTY2MDA4MSwiaXNzIjoibWdpX2F1dGgifQ.pMqfqu81XnBF4UZOHTjpoQMCHJKiZBSjWmC5mGdd8Zh7wALRVOOpGs_gTcWWZbkZyE85s31AsnNL7GZe3q_WDn0LL9S1U8YJ8FVHsgyyp8euuzqsyriNpLkF5kVvkQ69ybDRZI9wVmVwpc1VA_YmfxSlh_6t2poy735eEWk1J7XSK5IGFAiW3gKyxpqa_eXOZjDpdn_GTqhlPl12d-xFCmkha1c-_w0gPdm6DCeytfANMoGjwvQrzXMNF8WqnjCXK9IFJRrZ6Z4farQIux0WGZGjS9Q_--f0lo-x6DeWzKzHSVZ0bUiD45PdQZJTtEbBNRNTaLI8Bp6ewXLR_CCoow",
            newSocket: null,
            pushID: '506939110991',
            consumerWrappers: [],
            mainProducerId: '',
            device: null,
            transport: null
        }
    },
    mounted() {
        this._init()
    },
    methods: {
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
                isFetch: true
            });

            console.log('FetchVideo', `join room success, my name: jasonchen`);

            if (data.error) {
                console.error(data.error);

                return;
            }

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

                        await this._createConsumers();
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
        _init() {
            console.log('====推拉流初始化====');
            this.newSocket = getFetchVideoSocket(this.pushUrl, this.pushToken)
            this.newSocket.request = socketPromise(this.newSocket)
            this.newSocket.on('connect', async () => {
                const routerRtpCapabilities = await this.newSocket.request('getRouterRtpCapabilities', { roomId: this.pushID });
                await this._loadDevice(routerRtpCapabilities);
                await this._subscribe();
            });

            this.newSocket.on('disconnect', () => {
                console.log('FetchVideo', '连接断开');
            });

            this.newSocket.on('connect_error', err => {
                console.log('FetchVideo', '连接错误', err);
            });
            this.newSocket.on('on_consumer_close', async ({ consumerId }) => {
                console.log('FetchVideo', 'on_consumer_close', consumerId);
                let videoPlay = document.querySelector('video#player');
                videoPlay.srcObject = null;
                const consumerWrapper = this.consumerWrappers.find(item => item.id === consumerId);

                if (consumerWrapper) {
                    if (consumerWrapper.consumer) {
                        consumerWrapper.consumer.close();
                    }
                    const consumerWrappers = this.consumerWrappers.filter(item => item.id !== consumerId);

                    this.consumerWrappers = consumerWrappers
                }
            });
            this.newSocket.on('on_produce', async ({ roomId, id, kind }) => {
                console.log('FetchVideo', 'on_produce', roomId, id, kind);


                if (roomId === this.pushID && kind === 'video') {
                    const idx = this.consumerWrappers.findIndex(item => item.producerId === id);

                    if (idx < 0) {
                        console.log('FetchVideo', 'create local consumer for remote producer -> ', id);
                        const stream = await this._createConsumer(id);
                        this.consumerWrappers = [...this.consumerWrappers, stream]
                        this.playFetchVideo()
                    }
                }
            });

            this.newSocket.on('produce_main_change', async ({ roomId, mainProducerId }) => {
                console.log('produce_main_change', roomId, mainProducerId);

                if (roomId === this.pushID) {
                    this.mainProducerId = mainProducerId
                }
            });
        },
        playFetchVideo() {
            if (this.consumerWrappers.length > 0) {
                setTimeout(() => {
                    let videoPlay = document.querySelector('video#player');
                    videoPlay.srcObject = this.consumerWrappers[0].stream;
                    this.mainProducerId = this.consumerWrappers[0].producerId
                }, 1000);
            }
        },
        async _createConsumers() {
            console.log('FetchVideo', 'create consumers start...');

            const allProducers = await this.newSocket.request('get_all_video_producer', { roomId: this.pushID });
            console.log('FetchVideo', 'all producers -> ', allProducers);
            const consumerWrappers = [];

            for (const producerId of allProducers) {
                consumerWrappers.push(await this._createConsumer(producerId));
            }
            console.log('============_createConsumers=============', consumerWrappers);
            this.consumerWrappers = consumerWrappers
            this.playFetchVideo()
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
<style>
@media (min-width: 1024px) {
    .pull-stream {
        min-height: 100vh;
        display: flex;
        align-items: center;
    }
}
</style>
  