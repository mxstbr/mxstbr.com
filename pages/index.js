import React from "react";
import timeout from "p-timeout";
import { Card, Flex, Box, Link } from "rebass";
import Octicon, { LinkExternal } from "@githubprimer/octicons-react";
import Heading from "../components/Heading";
import Text from "../components/Text";
import { getGitHubRepoStars } from "../helpers/github-api";
import OSSProject from "../components/OpenSourceProjectCard";
import Appearance from "../components/AppearanceCard";
import RestrictHeight from "../components/RestrictHeight";
import appearances from "../appearances";
import formatDate from "../utils/format-date";

const H2 = props => <Heading fontSize={5} mb={3} mt={4} as="h2" {...props} />;

class Homepage extends React.Component {
  render() {
    return (
      <Box py={5}>
        <Box mb={4}>
          <H2 mt={0}>Open Source</H2>
          <Flex flexWrap="wrap">
            <OSSProject
              light
              stars={4676}
              repo="withspectrum/spectrum"
              bg="linear-gradient(to top right, #7213FB, #4F16EE)"
            >
              <OSSProject.Title>Spectrum</OSSProject.Title>
              <OSSProject.Description>
                Simple, powerful online communities in a unified platform.
              </OSSProject.Description>
            </OSSProject>
            <OSSProject
              stars={19445}
              repo="styled-components/styled-components"
              light
              bg="linear-gradient(to top right, #DB7093, #DAA357)"
            >
              <OSSProject.Title>styled-components</OSSProject.Title>
              <OSSProject.Description>
                Visual primitives for the component age. Use the best bits of
                ES6 and CSS to style your apps without stress 💅
              </OSSProject.Description>
            </OSSProject>
            <OSSProject
              stars={19984}
              repo="react-boilerplate/react-boilerplate"
              light
              bg="linear-gradient(to bottom right, #6D6E72, #9EA0A6)"
            >
              <OSSProject.Title>react-boilerplate</OSSProject.Title>
              <OSSProject.Description>
                A highly scalable foundation with a focus on development
                experience, performance and best practices
              </OSSProject.Description>
            </OSSProject>
            <OSSProject stars={722} repo="micro-analytics/micro-analytics">
              <OSSProject.Title>micro-analytics</OSSProject.Title>
              <OSSProject.Description>
                Public analytics as a Node.js microservice, no sysadmin
                experience required
              </OSSProject.Description>
            </OSSProject>
            <OSSProject stars={1495} repo="mxstbr/login-flow">
              <OSSProject.Title>Login Flow</OSSProject.Title>
              <OSSProject.Description>
                A login/register flow built with React and Redux
              </OSSProject.Description>
            </OSSProject>
            <OSSProject stars={2101} repo="mxstbr/sharingbuttons.io">
              <OSSProject.Title>sharingbuttons.io</OSSProject.Title>
              <OSSProject.Description>
                Super fast and easy Social Media Sharing Buttons. No JavaScript.
                No tracking.
              </OSSProject.Description>
            </OSSProject>
          </Flex>
          <Box mt={3}>
            <Link
              css={{
                textDecoration: "none",
                ":hover": { textDecoration: "underline" },
                display: "inline-block"
              }}
              href="https://github.com/mxstbr"
              target="_blank"
            >
              <Text fontWeight="bold">
                View more on GitHub
                <Box css={{ display: "inline-block" }} ml={2}>
                  <Octicon>
                    <LinkExternal />
                  </Octicon>
                </Box>
              </Text>
            </Link>
          </Box>
        </Box>
        <H2>Appearances</H2>
        <Flex flexDirection="row" flexWrap="wrap" width={734 - 16}>
          <RestrictHeight maxHeight="525px">
            {appearances.map((appearance, i) => (
              <React.Fragment key={appearance.title + appearance.site}>
                {!appearances[i - 1] ||
                appearances[i - 1].date.getFullYear() !==
                  appearance.date.getFullYear() ? (
                  <Flex
                    flexDirection="row"
                    alignItems="center"
                    width={734 - 16}
                    my={3}
                  >
                    <Heading fontSize={3} as="h3" mr={3} width={42 + 10}>
                      {appearance.date.getFullYear()}
                    </Heading>
                    <Box
                      css={{ background: "#BBB", width: "100%", height: "1px" }}
                    />
                  </Flex>
                ) : null}
                <Appearance {...appearance} />
              </React.Fragment>
            ))}
          </RestrictHeight>
        </Flex>
        <H2>Recent Posts</H2>
      </Box>
    );
  }
}

export default Homepage;
