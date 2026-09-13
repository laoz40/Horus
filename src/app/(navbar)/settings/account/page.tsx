import SignOutButton from "@/features/auth/components/SignOutButton";
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
							base: "rounded-lg",
							footer: "items-start rounded-b-lg",
						},
					}}
				/>
				<span className="text-sm text-gray-500 pt-4">Account</span>
				<SecuritySettingsCards
					classNames={{
						card: {
							base: "rounded-lg",
							footer: "rounded-b-lg",
						},
					}}
				/>

				<div className="w-full overflow-hidden rounded-lg border border-border bg-card p-5">
					<div className="mb-4 flex flex-col gap-1">
						<h3 className="text-lg font-semibold md:text-xl">Sign out</h3>
						<p className="text-sm text-muted-foreground">End this session on this device.</p>
					</div>
					<div className="-mx-5 -mb-5 flex flex-col items-start rounded-b-lg border-t border-border bg-background p-4 md:items-end">
						<SignOutButton />
					</div>
				</div>

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
