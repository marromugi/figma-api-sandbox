import { zValidator } from '@hono/zod-validator'
import { z } from 'zod'
import { requestFigma } from '../../libs/openapi'
import { createApp } from '../../libs/hono'

export const GetFrame = createApp().get(
  '/',
  zValidator(
    'query',
    z.object({
      fileKey: z.string(),
      page: z.string(),
      frame: z.string(),
    }),
  ),
  async (c) => {
    const { fileKey, page, frame } = c.req.valid('query')
    const res = await requestFigma('/v1/files/{file_key}', 'get', {
      path: {
        file_key: fileKey,
      },
      query: {},
    })
    const json = await res.json()
    const frames = json.document.children
      .find((c) => c.name === page)
      ?.children.filter((c) => c.name === frame)
      .filter((c) => c.type === 'FRAME')

    return c.json(frames)
  },
)

export default GetFrame
