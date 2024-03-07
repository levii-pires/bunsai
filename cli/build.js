#!/usr/bin/env bun

import { userConfig } from "../globals";
import useRecommended from "../recommended";

const { bunsai } = await useRecommended(userConfig);

await bunsai.build();
