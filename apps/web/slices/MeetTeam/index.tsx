import { FC } from "react";
import { Content } from "@prismicio/client";
import { PrismicRichText, SliceComponentProps } from "@prismicio/react";
import { PrismicImage } from "@prismicio/react";

/**
 * Props for `MeetTeam`.
 */
export type MeetTeamProps = SliceComponentProps<Content.MeetTeamSlice>;

const MeetTeam: FC<MeetTeamProps> = ({ slice }) => {
  return (
    <section
      data-slice-type={slice.slice_type}
      data-slice-variation={slice.variation}
      className="bg-muted/40 py-16 md:py-24"
    >
      <div className="mx-auto w-[min(92%,72rem)]">
        {/* Header */}
        <div className="mb-14 text-center md:mb-16">
          <h2 className="text-3xl font-semibold tracking-tight md:text-4xl">
            {slice.primary.heading}
          </h2>
        </div>

        <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
          {slice.primary.teams.map((member, index) => (
            <article
              key={index}
              className="border border-border bg-background p-6 text-center"
            >
              <div className="mx-auto mb-6 w-40 overflow-hidden rounded-full sm:w-44 md:w-48">
                <PrismicImage
                  field={member.person_image}
                  className="aspect-square h-full w-full object-cover"
                  sizes="(max-width: 48em) 40vw, 18vw"
                />
              </div>
              <h3 className="text-xl font-semibold tracking-tight">
                {member.person_name}
              </h3>
              <p className="mt-1 text-sm font-medium text-muted-foreground">
                {member.person_designation}
              </p>
              <p className="text-sm text-muted-foreground">
                {member.person_company}
              </p>
              <div className="prose prose-slate mt-4 max-w-none text-left prose-sm prose-p:leading-relaxed">
                <PrismicRichText field={member.content} />
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
};

export default MeetTeam;
