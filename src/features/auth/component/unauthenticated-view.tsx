import { ShieldAlertIcon } from "lucide-react";

import {
  Item,
  ItemActions,
  ItemContent,
  ItemDescription,
  ItemMedia,
  ItemTitle,
} from "@/components/ui/item";
import { SignInButton } from "@clerk/nextjs";
import { Button } from "@/components/ui/button";

export const UnauthenticatedView = () => {
  return (
    <div className="flex items-center justify-center h-screen bg-linear-to-br from-slate-0 via-black to-blue-950">
      <div className="w-full max-w-lg bg-muted rounded-xl">
        <div className="text-center">
          <div className="flex justify-center mt-4 text-2xl">Welcome to  <span className="flex font-semibold">&nbsp;
          <img src="/logo.svg" alt="polaris" className="m-1 size-[20px] md:size-[30px]" />
          POLARIS</span></div>
          <div className="m-2 text-muted-foreground">Your agentic IDE</div>
        </div>
        <Item variant="outline">
          <ItemMedia variant="icon">
            <ShieldAlertIcon />
          </ItemMedia>
          <ItemContent>
            <ItemTitle>SignIn to continue</ItemTitle>
            <ItemDescription>You are not authorized</ItemDescription>
          </ItemContent>
          <ItemActions>
            <SignInButton>
              <Button variant="outline" size="sm">
                SignIn
              </Button>
            </SignInButton>
          </ItemActions>
        </Item>
      </div>
    </div>
  );
};
