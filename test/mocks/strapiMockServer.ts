import type { SetupServer } from 'msw/node'
import type { StrapiConfig } from '../../src/lib/types'
import { http, HttpResponse } from 'msw'
import { setupServer } from 'msw/node'
import { getBaseUrl } from '../../src/lib/config'
import loginBadRequestResponse from './auth/loginBadRequestResponse.json'
import loginInvalidIdentifierOrPasswordResponse from './auth/loginInvalidIdentifierOrPasswordResponse.json'
import loginOkResponse from './auth/loginOkResponse.json'

export function getStrapiAuthMockServer(config: Required<StrapiConfig>): SetupServer {
  const baseURL = getBaseUrl(config)
  return setupServer(
    http.post(`${baseURL}/auth/local`, async ({ request }) => {
      const { identifier, password }: any = await request.json()

      // bad request scenario
      if (!identifier)
        return HttpResponse.json({ ...loginBadRequestResponse }, { status: 400 })
      // bad credential scenario
      if (password && password as string === 'invalid-password')
        return HttpResponse.json({ ...loginInvalidIdentifierOrPasswordResponse }, { status: 400 })

      // otherwise: successful login scenario
      return HttpResponse.json({ ...loginOkResponse }) as any
    }),
  )
}
