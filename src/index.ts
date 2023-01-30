import { redirect, type RequestEvent, type Handle } from '@sveltejs/kit'

export type Route = {
	pathname: string
	meta?: {
		[key: string]: any
	}
}

type RouteGuardOptions = {
	redirect: typeof redirect
	next?: Handle
	routes?: Route[]
	beforeEach?: (
		to: Route,
		event: RequestEvent,
		next: (path?: string) => void
	) => void | Promise<void>
}

export const createRouteGuard = ({
	redirect,
	routes = [],
	beforeEach = (_to, _event, next) => next(),
	next = ({ event, resolve }) => resolve(event),
}: RouteGuardOptions): Handle => {
	return (input) => {
		return new Promise((resolve) => {
			const route = routes.find((route) => {
				return new RegExp(
					route.pathname.replace(/\[[^\]]*]/g, '([\\w-]+)') + '$'
				).test(input.event.url.pathname)
			})
			if (!route) return resolve(next(input))
			beforeEach(route, input.event, (path) => {
				if (path) throw redirect(303, path)
				else return resolve(next(input))
			})
		})
	}
}
