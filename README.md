# Sveltekit Route Guard

`sveltekit-route-guard` is a JavaScript library for creating route guard for [SvelteKit](https://kit.svelte.dev).

The `sveltekit-route-guard` package contains only the functionality necessary to create a handle function for [`hooks.server.js`](https://kit.svelte.dev/docs/hooks) to handle the route guard. There is no extra dependency needed for this library.

[![npm version](https://img.shields.io/npm/v/sveltekit-route-guard.svg?style=flat-square)](https://www.npmjs.org/package/sveltekit-route-guard)
[![install size](https://img.shields.io/badge/dynamic/json?url=https://packagephobia.com/v2/api.json?p=sveltekit-route-guard&query=$.install.pretty&label=install%20size&style=flat-square)](https://packagephobia.now.sh/result?p=sveltekit-route-guard)
[![npm bundle size](https://img.shields.io/bundlephobia/minzip/sveltekit-route-guard?style=flat-square)](https://bundlephobia.com/package/sveltekit-route-guard@latest)
[![npm downloads](https://img.shields.io/npm/dm/sveltekit-route-guard.svg?style=flat-square)](https://npm-stat.com/charts.html?package=sveltekit-route-guard)
[![Known Vulnerabilities](https://snyk.io/test/npm/sveltekit-route-guard/badge.svg)](https://snyk.io/test/npm/sveltekit-route-guard)

## Installation

Using npm:

```shell
npm install sveltekit-route-guard
```

Using yarn:

```shell
yarn add sveltekit-route-guard
```

Using pnpm:

```shell
pnpm add sveltekit-route-guard
```

## Example

> **Note** You don't have to pass all the routes in your `/routes` directory. Just pass the routes you want to add guard. Other routes will be marked as allowed by default.

```ts
// src/hooks.server.ts
import { createRouteGuard } from 'sveltekit-route-guard'
import { redirect, type Handle } from '@sveltejs/kit'
export const handle: Handle = createRouteGuard({
  redirect,
  routes: [
    { pathname: '/protected' },
    { pathname: '/login' }
  ],
  beforeEach(to, event, next) {
    if (to.pathname === '/protected') {
      return next('/login')
    }
    return next()
  }
})
```

Using alongside [trpc](https://trpc.io/)[-sveltekit](https://icflorescu.github.io/trpc-sveltekit/):

```ts
// src/hooks.server.ts
import { router } from '$lib/trpc/router'
import { createTRPCHandle } from 'trpc-sveltekit'
import { createContext } from '$lib/trpc/context'
import { createRouteGuard } from 'sveltekit-route-guard'
import { redirect, type Handle } from '@sveltejs/kit'

const trpcHandle = createTRPCHandle({
  router,
  createContext
})

export const handle: Handle = createRouteGuard({
  redirect,
  next: trpcHandle,
  routes: [
    { pathname: '/protected' },
    { pathname: '/login' }
  ],
  beforeEach(to, event, next) {
    if (to.pathname === '/protected') {
      return next('/login')
    }
    return next()
  }
})

```

Using authentication:

```ts
// src/hooks.server.ts
import { verify } from 'jsonwebtoken'
import { JWT_SECRET } from '$env/static/private'
import { createRouteGuard } from 'sveltekit-route-guard'

import type { User } from '@prisma/client'
import type { Handle, RequestEvent } from '@sveltejs/kit'

const getCurrentUser = (event: RequestEvent) => {
  try {
    const token = event.cookies.get('token')
    return verify(token || '', JWT_SECRET) as User
  } catch (_) {
    return null
  }
}

export const handle: Handle = createRouteGuard({
  redirect,
  routes: [
    {
      pathname: '/projects',
      redirect: '/projects/dashboard',
      meta: {
        auth: true
      },
      children: [
        { pathname: '/dashboard' },
        { pathname: '/settings' }
      ]
    },
    {
      pathname: '/login',
      meta: {
        auth: false
      }
    }
  ],
  beforeEach(to, event, next) {
    // check if the user is authenticated ot not
    const user = getCurrentUser(event)
    if (user) event.locals.user = user

    // not authenticated and requires authentication is true
    if (!user && to.meta?.auth) {
      return next('/login')
    }

    // already authenticated, can't go to /login
    if (user && to.meta?.auth === false) {
      return next('/')
    }

    // no guard, continue the request
    return next()
  }
})
```
