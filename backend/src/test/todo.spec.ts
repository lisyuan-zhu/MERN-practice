import { FastifyInstance } from 'fastify'
import { startFastify } from '../server'
import { Server, IncomingMessage, ServerResponse } from 'http'
import * as dbHandler from './db'
import * as E from 'fp-ts/Either'
import { ITodo } from '../types/todo'
import { constTrue } from 'fp-ts/lib/function'

describe('Form test', () => {
    let server: FastifyInstance<Server, IncomingMessage, ServerResponse>

    beforeAll(async () => {
        await dbHandler.connect()
        server = startFastify(8888)
    })

    afterEach(async () => {
        await dbHandler.clearDatabase()
    })

    afterAll(async () => {
        E.match(
            (e) => console.log(e),
            (_) => console.log('Closing Fastify server is done!')
        )(
            E.tryCatch(
                () => {
                    dbHandler.closeDatabase()
                    server.close((): void => { })
                },
                (reason) => new Error(`Failed to close a Fastify server, reason: ${reason}`)
            )
        )
    })    

    // TODO: Add some test cases like CRUD, i.e. get, post, update, delete

    it('should get a empty list of Todos', async() => {
        const response = await server.inject({method: 'GET', url: '/api/todos'})
        expect(response.statusCode).toBe(200)
        expect(response.body).toStrictEqual(JSON.stringify({todos: []}))
    })

    it('should post a Todo to the db and should be found', async() => {
        const response = await server.inject({method: 'POST', url: '/api/todos',
                         payload: {
                             name: 'eat dinner',
                             description: 'should eat dinner at six pm',
                             status: false
                         }})
        expect(response.statusCode).toBe(201)
        const res: {todo: ITodo} = JSON.parse(response.body)
        expect(res.todo.name).toBe('eat dinner')
        expect(res.todo.description).toBe('should eat dinner at six pm')
        expect(res.todo.status).toBe(false)

        const getResponse = await server.inject({method: 'GET', url: '/api/todos'})
        expect(response.statusCode).toBe(200)
        const res2: {todos: Array<ITodo>} = JSON.parse(getResponse.body)
        expect(res2.todos.length).toBe(1)
        expect(res2.todos[0].name).toBe('eat dinner')
        expect(res2.todos[0].description).toBe('should eat dinner at six pm')
        expect(res2.todos[0].status).toBe(false)   
    })

    it('should and update a Todo to the db', async() => {
        const response = await server.inject({method: 'POST', url: '/api/todos/', 
                         payload: {
                             name: 'eat dinner',
                             description: 'should eat dinner at 6:30pm',
                             status: false
                         }})
        expect(response.statusCode).toBe(201)
        const res: {todo: ITodo} = JSON.parse(response.body)
        expect(res.todo.name).toBe('eat dinner')
        expect(res.todo.description).toBe('should eat dinner at 6:30pm')
        expect(res.todo.status).toBe(false)

        const id = res.todo._id
        const updateByIdResponse = await server.inject({method: 'PUT', url: 'api/todos/${id}', payload: {status: true}})
        const res2: {todo: ITodo} = JSON.parse(updateByIdResponse.body)
        expect(updateByIdResponse.statusCode).toBe(200)
        expect(res2.todo.name).toBe('eat dinner')
        expect(res2.todo.description).toBe('should eat dinner at 6:30pm')
        expect(res2.todo.status).toBe(true)
        
    })

    //it('should delete the Todo in the db', async() => {
    //    const response = await server.inject({method: 'POST', url: '/api/todos',
    //                     payload: {
    //                         name: 'eat dinner',
    //                         description: 'should eat dinner at 6:30pm',
    //                         status: false
    //                     }})
    //})

})
