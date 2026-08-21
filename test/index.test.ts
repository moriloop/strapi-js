import type { StrapiErrorResponse } from '../src/lib/types'
import { delay, http, HttpResponse } from 'msw'
import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest'
import { newStrapiSdk } from '../src'
import { getBaseUrl, mergeConfig, strapiDefaultConfig } from '../src/lib/config'
import { getStrapiAuthMockServer } from './mocks/strapiMockServer'

const server = getStrapiAuthMockServer(strapiDefaultConfig)
const strapiSdk = newStrapiSdk(strapiDefaultConfig)

describe('auth-sdk package exporting', () => {
  it('should export auth-sdk as a function with correct objects and methods', () => {
    expect(typeof strapiSdk.auth).toEqual('object')
    expect(Object.getOwnPropertyNames (strapiSdk.auth).sort()).toEqual([
      'changePassword',
      'emailConfirmation',
      'forgotPassword',
      'localRegister',
      'login',
      'resetPassword',
      'sendEmailConfirmation',
      'utilGetCurrentUser',
    ])
  })
})

describe('users-sdk package exporting', () => {
  it('should export users-sdk as a function with correct objects and methods', () => {
    expect(typeof strapiSdk.users).toEqual('object')
    expect(Object.getOwnPropertyNames (strapiSdk.users).sort()).toEqual([
      'deleteUserById',
      'getUserById',
      'getUsers',
      'me',
      'updateUserById',
    ])
  })
})

describe('content-sdk package exporting', () => {
  it('should export content-sdk as a function with correct objects and methods', () => {
    expect(typeof strapiSdk.content).toEqual('object')
    expect(Object.getOwnPropertyNames (strapiSdk.content).sort()).toEqual([
      'create',
      'delete',
      'find',
      'findOne',
      'update',
    ])
  })
})

describe('default fetch options', () => {
  it('should set zero retry and 30s timeout by default and allow override via mergeConfig', () => {
    expect(strapiDefaultConfig.defaultFetchOptions).toMatchObject({
      retry: 0,
      timeout: 30_000,
    })

    const mergedConfig = mergeConfig({
      defaultFetchOptions: {
        timeout: 5_000,
        headers: { 'x-test-header': 'enabled' },
      },
    })

    expect(mergedConfig.defaultFetchOptions).toMatchObject({
      retry: 0,
      timeout: 5_000,
      headers: { 'x-test-header': 'enabled' },
    })
  })
})

describe('request timeout behavior', () => {
  it('should timeout when the server response is slower than the configured default fetch timeout', async () => {
    const timeoutConfig = mergeConfig({
      defaultFetchOptions: {
        timeout: 50,
      },
    })
    const baseURL = getBaseUrl(timeoutConfig)
    const slowSdk = newStrapiSdk(timeoutConfig)

    server.use(
      http.post(`${baseURL}/auth/local`, async () => {
        await delay(200)
        return HttpResponse.json({
          jwt: 'slow-jwt',
          user: { id: 1, username: 'slow-user', email: 'slow@example.com' },
        })
      }),
    )

    await slowSdk.auth.login({
      identifier: 'valid-user',
      password: 'valid-password',
    }).catch((err) => {
      console.warn('[timeout-test] actual rejection:', err)
      expect(err).toMatchObject({
        name: 'TimeoutError',
        status: 408,
      })
    })
  })
})

describe('auth-sdk login method', () => {
  it('should throwing bad request without setting identifier or password parameter', async () => {
    try {
      const param: any = { password: 'a-password' }
      await strapiSdk.auth.login(param)
    }
    catch (err: any) {
      const strapiError: StrapiErrorResponse = err
      expect(strapiError.status).toEqual(400)
      expect(strapiError.message).toEqual('identifier is a required field')
    }
  })

  it('should throwing invalid identifier or password with wrong password', async () => {
    try {
      await strapiSdk.auth.login({
        identifier: 'valid-user',
        password: 'invalid-password',
      })
    }
    catch (err: any) {
      const strapiError: StrapiErrorResponse = err
      expect(strapiError.status).toEqual(400)
      expect(strapiError.message).toEqual('Invalid identifier or password')
    }
  })

  it('should successfully logged in with correct credentials', async () => {
    const { user, jwt } = await strapiSdk.auth.login({
      identifier: 'valid-user',
      password: 'valid-password',
    })
    expect(user).toBeTruthy()
    expect(jwt).toBeTruthy()
  })
})

beforeAll(() => server.listen())

afterEach(() => server.resetHandlers())

afterAll(() => server.close())
