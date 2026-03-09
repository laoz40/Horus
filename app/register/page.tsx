import { AuthView } from "@daveyplate/better-auth-ui";

export default function SignUpPage() {
	return (
		<div className="flex min-h-dvh items-center justify-center px-4">
			<AuthView
				path="/register"
				view="SIGN_UP"
				cardHeader="Create Horus account"
				classNames={{
					base: "rounded-none bg-transparent border-none shadow-none",
					header: "text-center text-xl font-semibold",
					title: "text-xl font-semibold",
				}}
			/>
		</div>
	);
}
