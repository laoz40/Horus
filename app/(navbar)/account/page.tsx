import {
	AccountSettingsCards,
	SecuritySettingsCards,
	DeleteAccountCard,
} from "@daveyplate/better-auth-ui";

export default function AccountPage() {
	return (
		<div className="flex justify-center py-12 px-4">
			<div className="flex flex-col gap-4 w-full max-w-xl">
				<span className="text-sm text-gray-500">User</span>
				<AccountSettingsCards
					classNames={{
						card: {
							base: "rounded-none",
							footer: "items-start",
						},
					}}
				/>
				<span className="text-sm text-gray-500 pt-4">Account</span>
				<SecuritySettingsCards
					classNames={{
						card: {
							base: "rounded-none",
							content: "rounded-none",
						},
					}}
				/>

				<DeleteAccountCard
					className="mt-4 rounded-none"
					classNames={{
						footer: "items-start",
					}}
				/>
			</div>
		</div>
	);
}
