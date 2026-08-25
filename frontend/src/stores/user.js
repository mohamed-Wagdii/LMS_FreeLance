import { defineStore } from 'pinia'
import { createResource } from 'frappe-ui'
import { getLmsRoute } from '../utils/basePath'
import router from '../router'

export const usersStore = defineStore('lms-users', () => {
	let userResource = createResource({
		url: 'lms.lms.api.get_user_info',
		onError(error) {
			if (error && error.exc_type === 'AuthenticationError') {
				document.cookie = 'user_id=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;'
				document.cookie = 'token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;'
				document.cookie = 'sid=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;'
				router.push({ name: 'Login' })
			}
		},
	})

	const allUsers = createResource({
		url: 'lms.lms.api.get_all_users',
		cache: ['allUsers'],
	})

	return {
		userResource,
		allUsers,
	}
})
