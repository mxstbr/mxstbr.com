import React from "react";
// NOTE: Using <Box /> here because the styled-components version
// used on the website doesn't support the css="" prop
import { Box } from "rebass";
import "twin.macro";

const TwinMacroExample = () => (
  <Box
    style={{ fontFamily: `sans-serif` }}
    tw="shadow-lg flex bg-white rounded-lg p-6 leading-normal"
  >
    <Box
      as="img"
      tw="h-24 w-24 rounded-full mx-0 mr-6"
      src="https://randomuser.me/api/portraits/women/17.jpg"
    />
    <Box tw="text-left">
      <Box as="h2" tw="text-lg">
        Erin Lindford
      </Box>
      <Box tw="text-purple-500">Customer Support</Box>
      <Box tw="text-gray-600">erinlindford@example.com</Box>
      <Box tw="text-gray-600">(555) 765-4321</Box>
    </Box>
  </Box>
);

export default TwinMacroExample;
