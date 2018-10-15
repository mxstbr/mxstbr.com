import { Heading, type RebassProps } from "rebass";

const BaseHeading = (props: RebassProps) => (
  <Heading
    lineHeight={1.25}
    fontFamily="system"
    alignSelf="flex-start"
    {...props}
  />
);

const H2 = (props: RebassProps) => (
  <BaseHeading fontSize={5} as="h2" mb={4} mt={5} {...props} />
);
const H3 = (props: RebassProps) => (
  <BaseHeading fontSize={3} as="h3" mb={1} mt={1} {...props} />
);

export { H2, H3 };

export default BaseHeading;
