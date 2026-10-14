# MULTI_FILE_PROJECTS — 2P-50

## Model

Smallest universal container: a **project Note** whose `contentJson.metadata.multiFileProject` lists **file Note ids**.

No second project engine. No Prisma migration.

```text
Project
 ├── document / notes (NOTE)
 ├── code (CODE)
 ├── data / other supported ArtifactType
 └── presentation (PRESENTATION)
```

Single Notes remain valid without a project.

## File contract

Each `ProjectFileRef`: `noteId`, `title`, `artifactType`, `order`.

Ownership: every Note `userId` must match session user. Foreign project/file → 404.

## Save isolation

File A and File B are different Note rows. PATCH on B never mutates A's `contentJson`.

Project meta updates use the same stale-write protection as Notes when `expectedUpdatedAt` is supplied.

## School context

Optional `schoolContext` / courseId / assignmentId on create (2P-49). Personal projects work without a course.

```text
Course → Assignment → Project → files → (optional) meaningful evaluation → LearningAttempt
```

Project creation / file edits ≠ mastery.

## Navigator

`ProjectFileNavigator`: add / open / remove (confirmed). Rename via API `rename-file`.

## Deferred

- Full in-CORE reorder UX polish  
- Activity-challenge mid-project resume (2P-47 structured project remains outline-submit)  
- Encrypted offline sync queue beyond local draft cache  
