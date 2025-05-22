import { serve } from '@hono/node-server'
import { createApp } from './libs/hono'
import GetFrame from './routes/frame/get'

const port = 8787
export const app = createApp().route('/frames', GetFrame)
serve({
  fetch: app.fetch,
  port,
})

console.log(`💨 Server is running on http://localhost:${port}`)
