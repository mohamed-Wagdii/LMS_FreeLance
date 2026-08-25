<template>
	<div class="flex min-h-screen items-center justify-center bg-gray-50 px-4 py-12 sm:px-6 lg:px-8">
		<div class="w-full max-w-md space-y-8 bg-white p-8 rounded-xl shadow-sm border border-gray-100">
			<div>
				<h2 class="mt-6 text-center text-3xl font-bold tracking-tight text-gray-900">
					{{ __('Log in to your account') }}
				</h2>
			</div>
			<form class="mt-8 space-y-6" @submit.prevent="handleLogin">
				<div class="space-y-4 rounded-md shadow-sm">
					<div>
						<label for="email-address" class="block text-sm font-medium text-gray-700">{{ __('Email address') }}</label>
						<Input
							id="email-address"
							name="email"
							type="email"
							autocomplete="email"
							required
							v-model="email"
							class="mt-1"
							:placeholder="__('Email address')"
						/>
					</div>
					<div>
						<label for="password" class="block text-sm font-medium text-gray-700">{{ __('Password') }}</label>
						<Input
							id="password"
							name="password"
							type="password"
							autocomplete="current-password"
							required
							v-model="password"
							class="mt-1"
							:placeholder="__('Password')"
						/>
					</div>
				</div>

				<ErrorMessage v-if="error" :message="error" />

				<div>
					<Button
						type="submit"
						class="w-full"
						:loading="loading"
						variant="solid"
					>
						{{ __('Sign in') }}
					</Button>
				</div>
			</form>
		</div>
	</div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { Input, Button, ErrorMessage, call } from 'frappe-ui'
import { useRouter, useRoute } from 'vue-router'
import { sessionStore } from '@/stores/session'
import { getLmsRoute } from '@/utils/basePath'

const router = useRouter()
const route = useRoute()

const email = ref('')
const password = ref('')
const loading = ref(false)
const error = ref('')

const handleLogin = async () => {
	loading.value = true
	error.value = ''
	try {
		await call('login', {
			usr: email.value,
			pwd: password.value,
		})
		let redirect = route.query['redirect-to']
		if (redirect) {
			redirect = getLmsRoute(redirect)
		} else {
			redirect = getLmsRoute('')
		}
		window.location.href = redirect
	} catch (err) {
		error.value = err.messages?.[0] || err.message || __('Invalid login credentials')
	} finally {
		loading.value = false
	}
}

onMounted(() => {
	const session = sessionStore()
	if (session.isLoggedIn) {
		router.push('/')
	}
})
</script>
