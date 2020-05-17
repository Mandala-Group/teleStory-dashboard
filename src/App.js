import React, { useEffect, useState } from 'react';
import './App.css';
import { Card, Icon, Image, Modal, Header, Button, Table, Label } from 'semantic-ui-react'
import * as firebase from "firebase/app";
import 'firebase/firestore';
import 'firebase/storage';
import Dropzone from 'react-dropzone';
import {
  apiKey,
  authDomain,
  databaseURL,
  projectId,
  storageBucket,
  messagingSenderId,
  appId,
} from './firebase_values.json';

firebase.initializeApp({
  apiKey,
  authDomain,
  databaseURL,
  projectId,
  storageBucket,
  messagingSenderId,
  appId
});
var db = firebase.firestore()

function App() {
  var [books, setBooks] = useState([])
  var [calls, setCalls] = useState([])
  var [files, setFiles] = useState([])
  var [isLoading, setLoading] = useState(false)
  useEffect(() => db.collection('books').get().then(snapshot => setBooks(snapshot.docs.map(doc => Object.assign(doc.data(), { id: doc.id, questionCount: Object.keys(doc.get('questionAndAnswer')).length })))), [])

  return (
    <div className="App">
      <div className="container">
        <Table color={'black'}>
          <Table.Header>
            <Table.Row>
              <Table.HeaderCell colSpan='3'>☎️ Recent Calls</Table.HeaderCell>
            </Table.Row>
          </Table.Header>
          <Table.Header>
            <Table.Row>
              <Table.HeaderCell></Table.HeaderCell>
              <Table.HeaderCell>Book</Table.HeaderCell>
              <Table.HeaderCell>Phone Number</Table.HeaderCell>
            </Table.Row>
          </Table.Header>
          <Table.Body>
            {calls.map(call => <Table.Row>
              <Table.Cell>
                <Label ribbon>{call.timestamp && new Date(call.timestamp.seconds * 1000).toDateString()}</Label>
              </Table.Cell>
              <Table.Cell>{call.book}</Table.Cell>
              <Table.Cell>{call.phoneNumber}</Table.Cell>
            </Table.Row>)}
          </Table.Body>
        </Table>
        <Modal closeOnDimmerClick={!isLoading} onOpen={_ => setFiles([])} trigger={<Card style={{ display: 'inline-flex', justifyContent: 'center', alignItems: 'center', textAlign: 'center', position: 'relative', top: 15 }}>
          <Card.Content>
            <Card.Header>
              <img src="https://cdn.iconscout.com/icon/free/png-256/plus-107-444920.png" style={{ height: 50, opacity: 0.5 }} />
            </Card.Header>
            <Card.Meta>
              <span style={{ margin: 16 }}>{'Click to add book'}</span>
            </Card.Meta>
          </Card.Content>
        </Card>
        }>
          <Modal.Header>{!isLoading ? 'Create a Book' : 'Creating book'} (<input type="text" id="id" maxLength={6} style={{ fontSize: 20, width: 76, fontWeight: 'bold', fontFamily: 'monospace' }} placeholder="000000" />)</Modal.Header>
          <Modal.Content image>
            <Dropzone onDrop={setFiles}>
              {({ getRootProps, getInputProps }) => (
                <section>
                  <div {...getRootProps()}>
                    <input {...getInputProps()} />
                    <Image style={{ padding: 40, backgroundColor: 'rgb(236, 236, 236)', marginRight: 20 }} wrapped size='small' src='http://www.iconarchive.com/download/i96063/iconsmind/outline/File-Upload.ico' />
                  </div>
                </section>
              )}
            </Dropzone>
            {isLoading ? <Modal.Description>
              <Header>Uploading...</Header>
            </Modal.Description> : <Modal.Description>
                <Header><input id="name" type="text" style={{ fontSize: 18, fontWeight: 'bold' }} placeholder="Name of book...." /></Header>
                <p>Number of chapters<input id="pageCount" type="text" style={{ fontSize: 14, marginLeft: 10, fontWeight: 'bold' }} placeholder="0" /></p>
                <p>Chapters with vocabulary<input id="vocabulary" type="text" style={{ fontSize: 14, marginLeft: 10, fontWeight: 'bold' }} placeholder="3,7" /></p>
                <p>Question and answers<input id="questionsAndAnswers" type="text" style={{ fontSize: 14, marginLeft: 10, fontWeight: 'bold' }} placeholder="2:1,8:2" /></p>
              </Modal.Description>}
          </Modal.Content>
          <Modal.Content>
            <b>{files.length ? files.length + ' files: ' : ''}</b>
            {files.map(file => <span style={{ color: 'grey' }}>{file.name}, </span>)}
          </Modal.Content>
          <Modal.Actions>
            <Button color='green' onClick={_ => submit(files, setLoading)} inverted>
              <Icon name='checkmark' /> Create
          </Button>
          </Modal.Actions>
        </Modal>
        {books.map(book => <Card key={book.id}>
          <Card.Content>
            <Card.Header>{book.id}</Card.Header>
            <Card.Meta>
              <span className='date'>{book.name}</span>
            </Card.Meta>
          </Card.Content>
          <Card.Content extra><a><Icon name='tags' /> {book.pageCount} Chapter(s)</a></Card.Content>
          <Card.Content extra><a><Icon name='question' />{book.questionCount} Question(s)</a></Card.Content>
          <Card.Content extra><a><Icon name='info' />{book.vocabulary.length} Vocabulary</a></Card.Content>
        </Card>)}
      </div>
    </div>
  );
}

async function uploadFiles(files) {
  var bucket = getValue('id')
  var storageRef = firebase.storage().ref();
  var uploadPromise = files.map(async f => await storageRef.child(bucket + '/' + f.name).put(f));
  await Promise.all(uploadPromise);
}
async function addBook() {
  var id = getValue('id')
  var pageCount = getValue('pageCount')
  var name = getValue('name')
  var vocabulary = getValue('vocabulary')
  var questionsAndAnswers = getValue('questionsAndAnswers')
  await db.collection('books').doc(id).set({
    pageCount,
    name,
    vocabulary: vocabulary.split(',').map(c => Number(c)),
    questionAndAnswer: Object.assign(...questionsAndAnswers.split(',').map(QnA => Object.assign({ [Number(QnA.split(':')[0])]: Number(QnA.split(':')[1]) }))),
    timestamp: new Date()
  })
}
async function submit(files, setLoading) {
  setLoading(true)
  await addBook()
  await uploadFiles(files);
  window.location.reload(true);
}
const getValue = (id) => document.getElementById(id).value

export default App;