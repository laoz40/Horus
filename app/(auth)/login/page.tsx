import { AuthView } from "@daveyplate/better-auth-ui";

export default function SignInPage() {
	return (
		<div className="flex min-h-dvh items-center justify-center px-4">
			<AuthView
				view="EMAIL_OTP"
				redirectTo="/migration-preview"
				cardHeader="Log in to Horus"
				cardFooter="Thanks for using my app, and have fun with your workout!"
				classNames={{
					base: "rounded-none bg-transparent border-none shadow-none",
					header: "text-center text-xl font-semibold",
					footer: "text-xs text-muted-foreground",
					form: {
						// target descendant elements (so ridiculous! why not give the actual component when it uses shadcn??)
						otpInputContainer:
							"[&_[data-slot=input-otp-group]]:w-full [&_[data-slot=input-otp-slot]]:flex-1 [&_[data-slot=input-otp-slot]]:h-9",
					},
				}}
			/>
		</div>
	);
}
