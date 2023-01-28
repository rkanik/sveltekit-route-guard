import { redirect, type RequestEvent, type Handle } from '@sveltejs/kit'

type Route = {
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
	next = async (input) => {
		return input.resolve(input.event)
	},
}: RouteGuardOptions): Handle => {
	return async (input: any) => {
		return new Promise((resolve) => {
			const route = routes.find((route) => {
				return route.pathname === input.event.url.pathname
			})
			if (!route) return resolve(next(input))
			beforeEach(route, input.event, (path) => {
				if (path) throw redirect(303, path)
				else return resolve(next(input))
			})
		})
	}
}
