import {getFromStorage} from 'app/server/disc-storage'
import {missing, getRemoteIp, limit} from 'app/server/utils-koa'
import config from 'config'


const {uploadBucket} = config
const router = require('koa-router')()

router.get('/:hash/:filename?', function *() {
    try {
        const ip = getRemoteIp(this.req)
        if(yield limit(this, 'downloadIp', ip, 'Downloads', 'request')) return

        if(missing(this, this.params, 'hash')) return

        const {hash} = this.params
        const key = `${hash}`

        yield new Promise(resolve => {
            getFromStorage(uploadBucket, key)
            .then((data) => {
                this.body = new Buffer(data.toString('binary'), 'binary')
                resolve()
            })
            .catch((err) => {
                console.log(err)
                this.status = 400
                this.statusText = `Error fetching ${key}.`
                this.body = {error: this.statusText}
                resolve()
                return
            })
        })
    } catch(error) {console.error(error)} 
})

export default router.routes()
