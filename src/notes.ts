import * as github from '@actions/github'
import * as semver from 'semver'
import {Inputs} from './context'

export async function generateReleaseNotes(
  client: ReturnType<typeof github.getOctokit>,
  inputs: Inputs,
  latestRelease: string,
  nextRelease: string,
): Promise<string> {
  const context = github.context
  const notes = await client.rest.repos.generateReleaseNotes({
    ...context.repo,
    tag_name: nextRelease,
    previous_tag_name: semver.gt(latestRelease, '0.0.0') ? latestRelease : '',
    target_commitish: context.ref.replace('refs/heads/', ''),
  })

  let body = notes.data.body
  if (inputs.header) {
    let header = replaceAll(inputs.header, '%TAG%', nextRelease)
    header = replaceAll(header, '%TAG_STRIPPED%', nextRelease.replace('v', ''))
    body = `${header}\n\n${body}`
  }
  if (inputs.footer) {
    let footer = replaceAll(inputs.footer, '%TAG%', nextRelease)
    footer = replaceAll(footer, '%TAG_STRIPPED%', nextRelease.replace('v', ''))
    body = `${body}\n\n${footer}`
  }

  return body
}

export function parseNotes(notes: string, major: string, minor: string): string {
  let notesType

  // if minor is empty, default to patch else search for minor in notes
  !minor ? (notesType = 'patch') : (notesType = notes.includes(`### ${minor}`) ? 'minor' : 'patch')

  // if major is empty, default to what was found else search for major in notes
  !major ? notesType : (notesType = notes.includes(`### ${major}`) ? 'major' : notesType)

  return notesType
}

function replaceAll(str: string, find: string, replace: string): string {
  return str.replace(new RegExp(find, 'g'), replace)
}
