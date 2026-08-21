import type { FetchError, FetchOptions } from 'ofetch'
import type { StrapiConfig, StrapiErrorResponse, StrapiFetchAdapter } from './types'
import { consola } from 'consola/basic'
import { createFetch, Headers, ofetch } from 'ofetch'
import { stringify } from 'qs'
import { isTest } from 'std-env'
import { getBaseUrl } from './config'

function defaultErrors(err: FetchError) {
  const isTimeout = err.name === 'TimeoutError' || /timeout/i.test(err.message || '')

  return {
    status: isTimeout ? 408 : 500,
    name: isTimeout ? 'TimeoutError' : 'UnknownError',
    message: err.message,
    details: err,
  }
}

export function UseStrapiOfetchAdapter(config: Required<StrapiConfig>): StrapiFetchAdapter {
  const baseURL = getBaseUrl(config)
  const defaultFetchOptions = {
    retry: 0,
    timeout: 30_000,
    ...(config.defaultFetchOptions ?? {}),
  }

  return async <T> (url: string, fetchOptions: FetchOptions<'json'> & { token?: string } = {}): Promise<T> => {
    const mergedFetchOptions: FetchOptions<'json'> & { token?: string } = {
      ...defaultFetchOptions,
      ...fetchOptions,
      headers: {
        ...(defaultFetchOptions.headers ?? {}),
        ...(fetchOptions.headers ?? {}),
      },
      params: {
        ...(defaultFetchOptions.params ?? {}),
        ...(fetchOptions.params ?? {}),
      },
    }

    const {
      token,
      params,
      headers: requestHeaders = {},
      ...restFetchOptions
    } = mergedFetchOptions

    const headers: Headers = new Headers(requestHeaders)

    // if explicity a token provided, we use it for header-authorization
    if (token) {
      headers.set('Authorization', `Bearer ${token}`)
      consola.debug('[strapi-js] Explicit jwt token provided and set into headers: ', headers.get('Authorization'))
    }
    else if (!headers.get('Authorization')) {
      consola.debug('[strapi-js] No explicit jwt token nor authorization header found for request')
    }

    // request params are encoded as query-params in the request url using qs library
    if (params) {
      const serializedParams = stringify(params, { encodeValuesOnly: true })
      if (serializedParams)
        url = `${url}?${serializedParams}`
    }

    try {
      // test (msw) issue with ofetch instance
      // https://github.com/unjs/ofetch/issues/295
      const fetchInstance = isTest ? createFetch() : ofetch
      const requestOptions = {
        baseURL,
        ...restFetchOptions,
        retry: restFetchOptions.retry ?? defaultFetchOptions.retry,
        headers,
      }
      return await <T> fetchInstance(url, requestOptions)
    }
    catch (err: any) {
      const strapiError: StrapiErrorResponse = err.data?.error || defaultErrors(err)
      if (strapiError.status === 408 || strapiError.name === 'TimeoutError') {
        const timeoutError = new Error(strapiError.message) as Error & StrapiErrorResponse
        timeoutError.name = 'TimeoutError'
        timeoutError.status = 408
        timeoutError.details = err
        throw timeoutError
      }
      throw strapiError
    }
  }
}
