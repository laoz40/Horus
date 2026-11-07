import { BackNavButton, backNavIconClassName } from "@/components/BackNavButton";
import { IconChevronLeft } from "@tabler/icons-react";
import Link from "next/link";
import SignOutCard from "@/features/auth/components/SignOutCard";
import {
	AccountSettingsCards,
	SecuritySettingsCards,
	DeleteAccountCard,
} from "@daveyplate/better-auth-ui";

export default function AccountPage() {
	return (
		<div className="flex justify-center px-4 py-4">
			<div className="flex w-full max-w-xl flex-col gap-4">
				<div className="flex items-center gap-0.5">
					<BackNavButton asChild>
						<Link
							href="/settings"
							aria-label="Back to settings">
							<IconChevronLeft className={backNavIconClassName} />
						</Link>
					</BackNavButton>
					<h1 className="text-2xl font-semibold">Your account</h1>
				</div>
				<span className="text-sm text-muted-foreground">User</span>
				<AccountSettingsCards
					classNames={{
						card: {
							base: "rounded-lg",
							footer: "items-start rounded-b-lg",
						},
					}}
				/>
				<span className="pt-4 text-sm text-muted-foreground">Account</span>
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
