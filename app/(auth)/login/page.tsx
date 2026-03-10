import { AuthView } from "@daveyplate/better-auth-ui";

export default function SignInPage() {
	return (
		<div className="flex min-h-dvh items-center justify-center px-4">
			<AuthView
				view="EMAIL_OTP"
				redirectTo="/welcome"
				cardFooter="Thanks for using my app!"
				cardHeader="Log in to Horus"
				classNames={{
					base: "rounded-none bg-transparent border-none shadow-none",
					header: "text-center text-xl font-semibold",
					footer: "text-center text-xs text-muted-foreground"
				}}
			/>
		</div>
	);
}
