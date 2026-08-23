import { HubBackBar } from "@/components/hub/HubBackBar";

import { QuizTaker } from "./quiz-taker";

export const dynamic = "force-dynamic";

export default async function TakeQuizPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  return (
    <>
      <HubBackBar title="Take quiz" />
      <QuizTaker quizId={id} />
    </>
  );
}
