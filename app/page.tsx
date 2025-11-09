import { Link } from "@heroui/link";
import { Snippet } from "@heroui/snippet";
import { Code } from "@heroui/code";
import { button as buttonStyles } from "@heroui/theme";

import { siteConfig } from "@/config/site";
import { title, subtitle } from "@/components/primitives";
import { GithubIcon } from "@/components/icons";
import NewChatComponent from "@/components/Chatbot2";

export default function Home() {
  return (
    // <ChatComponent/>
    <NewChatComponent/>
  );
}
