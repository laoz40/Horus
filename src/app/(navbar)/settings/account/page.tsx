import SignOutCard from "@/features/auth/components/SignOutCard";
import {
	AccountSettingsCards,
	SecuritySettingsCards,
	DeleteAccountCard,
} from "@daveyplate/better-auth-ui";

export default function AccountPage() {
	return (
		<div className="flex justify-center px-4 py-12">
			<div className="flex w-full max-w-xl flex-col gap-4">
				<span className="text-sm text-gray-500">User</span>
				<AccountSettingsCards
					classNames={{
						card: {
							base: "rounded-lg",
							footer: "items-start rounded-b-lg",
						},
					}}
				/>
				<span className="pt-4 text-sm text-gray-500">Account</span>
				<SecuritySettingsCards
					classNames={{
						card: {
							base: "rounded-lg",
							footer: "rounded-b-lg",
						},
					}}
				/>

				<SignOutCard
					classNames={{
						base: "rounded-lg",
						footer: "items-start rounded-b-lg",
					}}
				/>

				<DeleteAccountCard
					className="mt-4"
					classNames={{
						base: "rounded-lg",
						footer: "items-start rounded-b-lg",
					}}
				/>
			</div>
		</div>
	);
}
