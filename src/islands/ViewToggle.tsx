import { useEffect, useState } from "preact/hooks";
import type { SideProject } from "../lib/site";
import { sprites } from "../sprites";
import { document } from "../sprites/document";
import SpriteIcon from "./SpriteIcon";

type View = "icons" | "list";

type Props = {
	projects: readonly SideProject[];
};

const views: { id: View; label: string }[] = [
	{ id: "icons", label: "Icons" },
	{ id: "list", label: "List" },
];

const buttonBase =
	"border-window min-h-11 px-3 font-label text-label-sm uppercase";

function ProjectName({ project }: { project: SideProject }) {
	return project.href !== undefined ? (
		<a href={project.href} class="font-ui text-ui font-bold text-ink underline">
			{project.name}
		</a>
	) : (
		<span class="font-ui text-ui font-bold">{project.name}</span>
	);
}

export default function ViewToggle({ projects }: Props) {
	const [mounted, setMounted] = useState(false);
	const [view, setView] = useState<View>("icons");

	useEffect(() => {
		setMounted(true);
	}, []);

	return (
		<div>
			<fieldset
				hidden={!mounted}
				class="flex justify-end gap-2 border-b-window px-4 py-3"
				data-view-toggle
			>
				<legend class="sr-only">View</legend>
				{views.map((option) => {
					const pressed = option.id === view;
					return (
						<button
							key={option.id}
							type="button"
							aria-pressed={pressed ? "true" : "false"}
							onClick={() => setView(option.id)}
							class={
								pressed
									? `${buttonBase} bg-ink text-white`
									: `${buttonBase} bg-white text-ink`
							}
						>
							{option.label}
						</button>
					);
				})}
			</fieldset>
			{view === "icons" ? (
				<ul
					class="grid grid-cols-1 gap-6 p-5 @dock:grid-cols-2"
					data-view="icons"
				>
					{projects.map((project) => (
						<li
							key={project.name}
							class="flex items-start gap-4"
							data-project={project.name}
						>
							<SpriteIcon
								sprite={sprites[project.sprite] ?? document}
								scale={4}
								class="shrink-0"
							/>
							<div class="flex min-w-0 flex-col gap-1">
								<ProjectName project={project} />
								<span class="font-ui text-ui-sm leading-ui">
									{project.description}
								</span>
								<span class="font-label text-label-sm">{project.stack}</span>
							</div>
						</li>
					))}
				</ul>
			) : (
				<div data-view="list">
					<table class="w-full table-fixed border-collapse font-ui text-ui-sm leading-ui wrap-anywhere">
						<thead>
							<tr class="border-b-window bg-yellow text-left">
								<th scope="col" class="px-4 py-2">
									Name
								</th>
								<th scope="col" class="px-4 py-2">
									What it is
								</th>
								<th scope="col" class="px-4 py-2">
									Stack
								</th>
							</tr>
						</thead>
						<tbody>
							{projects.map((project) => (
								<tr
									key={project.name}
									class="border-b-2 border-ink last:border-b-0"
									data-project={project.name}
								>
									<td class="px-4 py-2">
										<ProjectName project={project} />
									</td>
									<td class="px-4 py-2">{project.description}</td>
									<td class="px-4 py-2">{project.stack}</td>
								</tr>
							))}
						</tbody>
					</table>
				</div>
			)}
		</div>
	);
}
