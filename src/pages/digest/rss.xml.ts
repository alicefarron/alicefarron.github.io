import type { APIRoute } from "astro";
import { feedResponse } from "../../lib/feed-items";

export const GET: APIRoute = ({ site }) => feedResponse("digest", site);
